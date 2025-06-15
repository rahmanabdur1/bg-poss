// controllers/mediaController.js
const axios = require('axios');
const Media = require('../models/Media');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY;

exports.uploadMedia = async (req, res) => {
  try {
    const {
      image,
      uploadedBy,
      title,
      caption,
      description,
      altText,
      fileName,
      fileSize,
      fileType,
      width,
      height,
    } = req.body;

    let imageUrl = '';
    let deleteUrl = '';

    if (image) {
      const formData = new URLSearchParams();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', image);

      const response = await axios.post('https://api.imgbb.com/1/upload', formData);
      imageUrl = response.data.data.url;
      deleteUrl = response.data.data.delete_url;
    }

    const media = await Media.create({
      image: imageUrl,
      deleteUrl,
      uploadedBy,
      uploadedAt: new Date(),
      title,
      caption,
      description,
      altText,
      fileName,
      fileSize,
      fileType,
      width,
      height,
    });

    res.status(201).json(media);
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: 'Upload failed' });
  }
};

exports.getAllMedia = async (req, res) => {
  try {
    const media = await Media.find().sort({ uploadedAt: -1 });
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get media' });
  }
};

exports.updateMedia = async (req, res) => {
  try {
    const updated = await Media.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media' });
  }
};

exports.deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Not found' });

    if (media.deleteUrl) {
      try {
        await axios.get(media.deleteUrl);
        console.log(`Deleted from ImgBB: ${media.deleteUrl}`);
      } catch (imgbbError) {
        console.error(`Failed to delete from ImgBB: ${imgbbError.message}`);
      }
    }

    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media' });
  }
};
