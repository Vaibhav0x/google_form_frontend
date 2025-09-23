// services/uploadService.js
const API_BASE_URL = 'http://localhost:5000';

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        // Return absolute URL for the image
        return `${API_BASE_URL}${data.filePath}`;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

export const uploadMultipleImages = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('images', file);
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload/images`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        const data = await response.json();
        // Return absolute URLs
        return data.files.map(file => `${API_BASE_URL}${file.filePath}`);
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
};

export const deleteImage = async (fileName) => {
    try {
        const response = await fetch(`${API_BASE_URL}/upload/image`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ fileName })
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Delete error:', error);
        throw error;
    }
};