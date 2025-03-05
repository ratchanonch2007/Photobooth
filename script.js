let stream;
let photoCount = 0;
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const editBtn = document.getElementById('editBtn');
const saveBtn = document.getElementById('saveBtn');

// Initialize camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
    } catch (err) {
        console.error('Error accessing camera:', err);
    }
}

// Capture photo
captureBtn.addEventListener('click', () => {
    if (photoCount >= 3) {
        photoCount = 0;
    }
    
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photoImg = document.getElementById(`photo${photoCount + 1}`);
    photoImg.src = canvas.toDataURL('image/png');
    
    photoCount++;
    
    if (photoCount === 3) {
        editBtn.disabled = false;
        captureBtn.disabled = true;
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

// Save functionality
saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'photobooth-photos.png';
    const mergeCanvas = document.createElement('canvas');
    mergeCanvas.width = 600;
    mergeCanvas.height = 200;
    const ctx = mergeCanvas.getContext('2d');
    
    document.querySelectorAll('.photo').forEach((photo, index) => {
        ctx.drawImage(photo, index * 200, 0, 200, 200);
    });
    
    link.href = mergeCanvas.toDataURL();
    link.click();
});

// Initialize
initCamera();
