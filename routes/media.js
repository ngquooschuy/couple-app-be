const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getSupabase } = require('../config/db');

const upload = multer({ storage: multer.memoryStorage() });

// Hàm kiểm tra và tạo bucket nếu chưa tồn tại
async function ensureBucketExists() {
  const supabase = getSupabase();
  try {
    // Kiểm tra bucket có tồn tại không
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    const mediaBucket = buckets?.find(b => b.name === 'media');

    if (!mediaBucket) {
      // Nếu bucket chưa tồn tại, tạo mới
      const { data, error: createError } = await supabase.storage.createBucket('media', {
        public: true, // Cho phép truy cập công khai
        fileSizeLimit: 52428800, // Giới hạn 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        throw createError;
      }
      console.log('Created media bucket successfully');
    }
  } catch (error) {
    console.error('Error checking/creating bucket:', error);
    throw error;
  }
}

router.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const challengeLogId = req.body.challengeLogId;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!challengeLogId) {
    return res.status(400).json({ error: 'challengeLogId is required' });
  }

  try {
    // Đảm bảo bucket tồn tại trước khi upload
    await ensureBucketExists();

    const fileExt = file.originalname.split('.').pop();
    const filePath = `challenge-logs/${challengeLogId}/${Date.now()}.${fileExt}`;

    const supabase = getSupabase();
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from('media')
      .insert([{
        challenge_log_id: challengeLogId,
        media_url: urlData.publicUrl,
        type: file.mimetype.startsWith('image') ? 'image' : 'video'
      }]);

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: dbError.message });
    }

    res.json({ 
      url: urlData.publicUrl,
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

module.exports = router;