let stream;
let photoCount = 0;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');

// Initialize camera with better error handling
async function initCamera() {
    const cameraMessage = document.getElementById('camera-message');
    const videoElement = document.getElementById('video');
    
    try {
        // Make sure any old stream is stopped
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        videoElement.srcObject = stream;
        await videoElement.play(); // Ensure video is playing

        // Wait for video to be ready
        await new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                resolve();
            };
        });

        cameraMessage.style.display = 'none';
        videoElement.style.display = 'block';
        captureBtn.disabled = false;
        
    } catch (err) {
        console.error('Camera error:', err);
        cameraMessage.style.display = 'block';
        videoElement.style.display = 'none';
        captureBtn.disabled = true;
        alert('กรุณาอนุญาตการใช้งานกล้อง หรือตรวจสอบว่ากล้องไม่ได้ถูกใช้งานโดยโปรแกรมอื่น');
    }
}

// Add camera enable button handler
document.getElementById('enableCameraBtn').addEventListener('click', async () => {
    await initCamera();
});

// Modify existing camera initialization
window.addEventListener('load', async () => {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        await initCamera();
    } else {
        alert('กล้องไม่พร้อมใช้งาน หรือ เบราว์เซอร์ไม่รองรับการใช้งานกล้อง');
    }
});

// Add after initCamera()
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.multiple = true;
fileInput.style.display = 'none';

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file, index) => {
        if (index >= 3) return; // Limit to 3 photos
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const photoImg = document.getElementById(`photo${index + 1}`);
            photoImg.src = event.target.result;
            photoCount++;
            
            if (photoCount >= 3) {
                editBtn.disabled = false;
                captureBtn.disabled = true;
            }
        };
        reader.readAsDataURL(file);
    });
});

// Fixed capture photo function
captureBtn.addEventListener('click', async () => {
    try {
        if (!stream || !video.srcObject) {
            throw new Error('Camera not ready');
        }

        // Reset counter if needed
        if (photoCount >= 3) {
            photoCount = 0;
        }

        // Make sure video is playing and ready
        if (video.paused || video.ended) {
            await video.play();
        }

        // Wait for next video frame
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Set canvas size to match video
        canvas.width = video.videoWidth || video.clientWidth;
        canvas.height = video.videoHeight || video.clientHeight;

        // Draw current video frame
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get photo element and update it
        const photoImg = document.getElementById(`photo${photoCount + 1}`);
        if (!photoImg) {
            throw new Error('Photo element not found');
        }

        // Convert to JPEG with good quality
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Update photo count only after image loads successfully
        photoImg.onload = () => {
            photoCount++;
            console.log('Photo captured:', photoCount);
            
            if (photoCount === 3) {
                editBtn.disabled = false;
                captureBtn.disabled = true;
            }
        };

        // Set image source
        photoImg.src = imageData;

    } catch (error) {
        console.error('Capture error:', error);
        alert('เกิดข้อผิดพลาดในการถ่ายภาพ: ' + error.message);
    }
});

// Edit mode
editBtn.addEventListener('click', () => {
    document.querySelector('.editor').style.display = 'block';
    document.querySelector('.booth-container').style.display = 'none';
});

// Apply filters
const filters = {
    normal: '',
    vintage: 'sepia(0.7)',
    pinky: 'saturate(1.5) hue-rotate(30deg)',
    sweet: 'brightness(1.1) contrast(1.1) saturate(1.3)',
    dreamy: 'brightness(1.2) contrast(0.9) saturate(0.8) opacity(0.9)',
    pastel: 'brightness(1.1) saturate(0.8) hue-rotate(-10deg)'
};

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        document.querySelectorAll('.photo').forEach(photo => {
            photo.style.filter = filters[filter] || '';
        });
    });
});

// Add live preview for filters
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('mouseover', () => {
        const filter = btn.dataset.filter;
        const tempFilter = filters[filter] || '';
        document.querySelectorAll('.photo').forEach(photo => {
            photo.dataset.originalFilter = photo.style.filter;
            photo.style.filter = tempFilter;
        });
    });

    btn.addEventListener('mouseout', () => {
        document.querySelectorAll('.photo').forEach(photo => {
            photo.style.filter = photo.dataset.originalFilter || '';
        });
    });
});

// Sticker functionality
let activeSticker = null;

document.addEventListener('mousemove', (e) => {
    if (activeSticker) {
        activeSticker.style.left = (e.clientX - 25) + 'px';
        activeSticker.style.top = (e.clientY - 25) + 'px';
    }
});

document.querySelectorAll('.sticker').forEach(sticker => {
    sticker.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.src);
    });

    sticker.addEventListener('dragend', (e) => {
        const clone = sticker.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.left = (e.clientX - 25) + 'px';
        clone.style.top = (e.clientY - 25) + 'px';
        
        clone.addEventListener('dblclick', () => {
            clone.style.transform = `rotate(${Math.random() * 360}deg)`;
        });
        
        clone.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            clone.remove();
        });
        
        document.querySelector('.editor').appendChild(clone);
    });
});

// Enhanced sticker preview
document.querySelectorAll('.sticker').forEach(sticker => {
    sticker.addEventListener('mouseover', (e) => {
        const preview = document.createElement('div');
        preview.className = 'sticker-preview';
        preview.innerHTML = `<img src="${sticker.src}" alt="Sticker Preview">`;
        document.body.appendChild(preview);
        
        const updatePreviewPosition = (event) => {
            const rect = sticker.getBoundingClientRect();
            preview.style.left = rect.right + 10 + 'px';
            preview.style.top = rect.top + 'px';
        };
        
        updatePreviewPosition(e);
        document.addEventListener('mousemove', updatePreviewPosition);
        
        sticker.addEventListener('mouseout', () => {
            preview.remove();
            document.removeEventListener('mousemove', updatePreviewPosition);
        }, { once: true });
    });
});

document.querySelectorAll('.photo').forEach(photo => {
    photo.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    photo.addEventListener('drop', (e) => {
        e.preventDefault();
        const stickerSrc = e.dataTransfer.getData('text/plain');
        const stickerImg = document.createElement('img');
        stickerImg.src = stickerSrc;
        stickerImg.style.position = 'absolute';
        stickerImg.style.left = (e.offsetX - 25) + 'px';
        stickerImg.style.top = (e.offsetY - 25) + 'px';
        stickerImg.style.width = '50px';
        stickerImg.style.height = '50px';
        photo.parentElement.appendChild(stickerImg);
    });
});

// Frame preview functionality
document.querySelectorAll('.frame-option').forEach(frame => {
    frame.addEventListener('mouseover', (e) => {
        const preview = document.createElement('div');
        preview.className = 'frame-preview';
        preview.innerHTML = `<img src="${frame.querySelector('img').src}" alt="Frame Preview">`;
        document.body.appendChild(preview);
        
        const rect = frame.getBoundingClientRect();
        preview.style.left = rect.right + 10 + 'px';
        preview.style.top = rect.top + 'px';
        preview.style.display = 'block';
    });

    frame.addEventListener('mouseout', () => {
        const preview = document.querySelector('.frame-preview');
        if (preview) preview.remove();
    });

    frame.addEventListener('click', () => {
        const frameStyle = frame.dataset.frame;
        document.querySelectorAll('.photo').forEach(photo => {
            switch(frameStyle) {
                case 'cute-pink':
                    photo.style.border = '5px solid #ff69b4';
                    photo.style.borderImage = 'linear-gradient(45deg, #ff69b4, #ff1493) 1';
                    break;
                case 'hearts':
                    photo.style.border = '5px solid #ff1493';
                    photo.style.borderImage = 'url("frames/heart-border.png") 30 round';
                    break;
                case 'stars':
                    photo.style.border = '5px solid #4169e1';
                    photo.style.borderImage = 'url("frames/star-border.png") 30 round';
                    break;
                case 'glitter':
                    photo.style.border = '5px solid #9400d3';
                    photo.style.borderImage = 'url("frames/glitter-border.png") 30 round';
                    break;
            }
        });
    });
});

// Add preview for frames
document.querySelectorAll('.frame-option').forEach(frame => {
    frame.addEventListener('mouseover', () => {
        const frameStyle = frame.dataset.frame;
        document.querySelectorAll('.photo').forEach(photo => {
            photo.dataset.originalBorder = photo.style.border;
            photo.dataset.originalBorderImage = photo.style.borderImage;
            
            switch(frameStyle) {
                case 'cute-pink':
                    photo.style.border = '5px solid #ff69b4';
                    photo.style.borderImage = 'linear-gradient(45deg, #ff69b4, #ff1493) 1';
                    break;
                // ...existing frame cases...
            }
        });
    });

    frame.addEventListener('mouseout', () => {
        document.querySelectorAll('.photo').forEach(photo => {
            photo.style.border = photo.dataset.originalBorder || '';
            photo.style.borderImage = photo.dataset.originalBorderImage || '';
        });
    });
});

// Fix save functionality
saveBtn.addEventListener('click', () => {
    try {
        const mergeCanvas = document.createElement('canvas');
        const ctx = mergeCanvas.getContext('2d');
        
        // Set appropriate dimensions
        mergeCanvas.width = 600;
        mergeCanvas.height = 200;
        
        // Draw each photo
        const photos = document.querySelectorAll('.photo');
        let validPhotos = 0;
        
        photos.forEach((photo, index) => {
            if (photo.complete && photo.naturalHeight !== 0) {
                ctx.drawImage(photo, index * 200, 0, 200, 200);
                validPhotos++;
            }
        });
        
        if (validPhotos === 0) {
            throw new Error('No valid photos to save');
        }
        
        // Create download link
        const link = document.createElement('a');
        link.download = `photobooth-${new Date().getTime()}.jpg`;
        link.href = mergeCanvas.toDataURL('image/jpeg', 0.8);
        link.click();
        
    } catch (error) {
        console.error('Error saving photos:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกภาพ กรุณาลองใหม่');
    }
});

// Handle window resize for responsive layout
window.addEventListener('resize', () => {
    const editor = document.querySelector('.editor');
    if (window.innerWidth <= 768) {
        editor.style.maxWidth = '100%';
    } else {
        editor.style.maxWidth = '1000px';
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

// Initialize
initCamera();
