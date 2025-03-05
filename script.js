let stream;
let photoCount = 0;

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureBtn = document.getElementById('captureBtn');
const saveBtn = document.getElementById('saveBtn');

let selectedFrame = 'classic';

// เพิ่ม object สำหรับเก็บค่าสีและอีโมจิของแต่ละ frame
const frameStyles = {
    classic: {
        color: '#FF69B4',
        emoji: '✨',
        title: 'Classic Booth'
    },
    hearts: {
        color: '#FF1493',
        emoji: '💖',
        title: 'Love Frame'
    },
    stars: {
        color: '#FFD700',
        emoji: '⭐',
        title: 'Star Frame'
    },
    cute: {
        color: '#FF98CC',
        emoji: '🌸',
        title: 'Cute Frame'
    }
};

// Add frame selection handler
document.querySelectorAll('.frame-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.frame-option').forEach(opt => 
            opt.classList.remove('selected'));
        option.classList.add('selected');
        selectedFrame = option.dataset.frame;
    });
});

async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' }
        });
        video.srcObject = stream;
        await video.play();
        captureBtn.disabled = false;
    } catch (err) {
        alert('กรุณาอนุญาตการใช้งานกล้อง');
        console.error(err);
    }
}

captureBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const photo = document.getElementById(`photo${photoCount + 1}`);
    photo.src = canvas.toDataURL('image/jpeg');
    photoCount = (photoCount + 1) % 3;
});

// Update save button handler
saveBtn.addEventListener('click', async () => {
    try {
        const photos = Array.from(document.querySelectorAll('.photo'));
        const validPhotos = photos.filter(photo => 
            photo.src && photo.src !== window.location.href);

        if (validPhotos.length === 0) {
            alert('กรุณาถ่ายภาพอย่างน้อย 1 ภาพ');
            return;
        }

        const frameStyle = frameStyles[selectedFrame];
        const mergeCanvas = document.createElement('canvas');
        const ctx = mergeCanvas.getContext('2d');
        
        // กำหนดขนาดแนวตั้ง
        const photoWidth = 200;
        const photoHeight = 150;
        const spacing = 10;
        
        mergeCanvas.width = photoWidth + 50; // รวมขอบ
        mergeCanvas.height = (photoHeight * validPhotos.length) + 
                           (spacing * (validPhotos.length + 1)) + 50;

        // พื้นหลังสีขาว
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, mergeCanvas.width, mergeCanvas.height);

        // วาดรูปแต่ละรูปในแนวตั้ง
        let yOffset = spacing + 25;
        
        // รอให้รูปทั้งหมดโหลดเสร็จ
        await Promise.all(validPhotos.map(async (photo, index) => {
            // วาดรูป
            ctx.drawImage(photo, 
                25, yOffset, 
                photoWidth, photoHeight
            );
            
            // เพิ่มกรอบด้วยสีตาม frame ที่เลือก
            ctx.strokeStyle = frameStyle.color;
            ctx.lineWidth = 3;
            ctx.strokeRect(25, yOffset, photoWidth, photoHeight);
            
            // เพิ่มอีโมจิที่มุมบนขวาของแต่ละรูป
            ctx.font = '20px Arial';
            ctx.fillStyle = frameStyle.color;
            ctx.fillText(frameStyle.emoji, 
                photoWidth + 10, 
                yOffset + 25
            );
            
            yOffset += photoHeight + spacing;
        }));

        // เพิ่มการตกแต่ง
        ctx.font = 'bold 20px Prompt';
        ctx.fillStyle = frameStyle.color;
        ctx.textAlign = 'center';
        ctx.fillText(
            `${frameStyle.emoji} ${frameStyle.title} ${frameStyle.emoji}`, 
            mergeCanvas.width/2, 
            20
        );

        // สร้างลิงก์ดาวน์โหลด
        const link = document.createElement('a');
        link.download = `photobooth-${selectedFrame}-${Date.now()}.jpg`;
        link.href = mergeCanvas.toDataURL('image/jpeg', 0.9);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`บันทึกภาพสำเร็จ! ${frameStyle.emoji}`);

    } catch (error) {
        console.error('Save error:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกภาพ กรุณาลองใหม่อีกครั้ง');
    }
});

// เพิ่มการแสดงตัวอย่างสีกรอบเมื่อเลือก frame
document.querySelectorAll('.frame-option').forEach(option => {
    option.addEventListener('click', () => {
        const frame = option.dataset.frame;
        const style = frameStyles[frame];
        document.querySelectorAll('.photo').forEach(photo => {
            photo.style.borderColor = style.color;
        });
    });
});

// Initialize camera
initCamera();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
