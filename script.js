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
        title: 'Classic Booth',
        background: '#FFF5F8'
    },
    hearts: {
        color: '#FF1493',
        emoji: '💖',
        title: 'Love Frame',
        background: '#FFE6F3'
    },
    stars: {
        color: '#FFD700',
        emoji: '⭐',
        title: 'Star Frame',
        background: '#FFFBE6'
    },
    cute: {
        color: '#FF98CC',
        emoji: '🌸',
        title: 'Cute Frame',
        background: '#FFF0F5'
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
        // ตรวจสอบว่าเป็นมือถือหรือไม่
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        const constraints = {
            video: {
                facingMode: isMobile ? "environment" : "user",
                width: { ideal: isMobile ? 1280 : 1920 },
                height: { ideal: isMobile ? 720 : 1080 }
            }
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        // ปรับการแสดงผลวิดีโอตามอุปกรณ์
        video.style.transform = isMobile ? 'scaleX(1)' : 'scaleX(-1)';
        
        await video.play();
        captureBtn.disabled = false;

        // ปรับขนาด canvas ตามวิดีโอ
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    } catch (err) {
        console.error('Camera error:', err);
        alert('กรุณาอนุญาตการใช้งานกล้อง');
    }
}

// เพิ่มฟังก์ชันลบรูปภาพ
document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const photoId = btn.dataset.photo;
        const photo = document.getElementById(`photo${photoId}`);
        photo.src = '';
        photoCount = Math.min(photoCount - 1, 0);
        
        // อัพเดทสถานะปุ่ม Save
        const validPhotos = Array.from(document.querySelectorAll('.photo'))
            .filter(p => p.src && p.src !== window.location.href);
        if (validPhotos.length === 0) {
            saveBtn.disabled = true;
        }
    });
});

// แก้ไขฟังก์ชัน capture เพื่อให้ทำงานกับการลบภาพ
captureBtn.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // หารูปแรกที่ว่าง
    const photos = document.querySelectorAll('.photo');
    let targetPhoto = null;
    for (let i = 0; i < photos.length; i++) {
        if (!photos[i].src || photos[i].src === window.location.href) {
            targetPhoto = photos[i];
            photoCount = i;
            break;
        }
    }
    
    // ถ้าไม่มีที่ว่าง ใช้ตำแหน่งปัจจุบัน
    if (!targetPhoto) {
        targetPhoto = document.getElementById(`photo${photoCount + 1}`);
        photoCount = (photoCount + 1) % 3;
    }
    
    targetPhoto.src = canvas.toDataURL('image/jpeg');
    saveBtn.disabled = false;
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
        
        // ปรับขนาดภาพให้ได้สัดส่วนที่ดีขึ้น
        const photoWidth = 400;  // เพิ่มความกว้าง
        const photoHeight = 300; // เพิ่มความสูง
        const spacing = 20;      // เพิ่มระยะห่าง
        const padding = 40;      // เพิ่มขอบ
        
        // ตั้งค่าขนาด canvas
        mergeCanvas.width = photoWidth + (padding * 2);
        mergeCanvas.height = (photoHeight * validPhotos.length) + 
                           (spacing * (validPhotos.length - 1)) + 
                           (padding * 2) + 60; // เพิ่มพื้นที่สำหรับหัวและท้าย

        // วาดพื้นหลัง
        ctx.fillStyle = frameStyle.background;
        ctx.fillRect(0, 0, mergeCanvas.width, mergeCanvas.height);

        // เพิ่มหัวกระดาษ
        ctx.font = 'bold 36px Prompt';
        ctx.fillStyle = frameStyle.color;
        ctx.textAlign = 'center';
        ctx.fillText(
            `${frameStyle.emoji} Photo Booth ${frameStyle.emoji}`, 
            mergeCanvas.width/2, 
            padding
        );

        // วาดรูปแต่ละรูปในแนวตั้ง
        let yOffset = padding + 40; // เริ่มต้นหลังหัวกระดาษ
        
        await Promise.all(validPhotos.map(async (photo, index) => {
            // วาดกรอบด้านหลัง
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(padding, yOffset, photoWidth, photoHeight);
            
            // วาดรูป
            ctx.drawImage(photo, 
                padding, yOffset, 
                photoWidth, photoHeight
            );
            
            // วาดกรอบ
            ctx.strokeStyle = frameStyle.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(padding, yOffset, photoWidth, photoHeight);
            
            // เพิ่มอีโมจิที่มุม
            ctx.font = '24px Arial';
            ctx.fillStyle = frameStyle.color;
            ctx.textAlign = 'left';
            ctx.fillText(frameStyle.emoji, 
                padding + 10, 
                yOffset + 30
            );
            
            yOffset += photoHeight + spacing;
        }));

        // เพิ่มท้ายกระดาษ
        ctx.font = '20px Prompt';
        ctx.fillStyle = frameStyle.color;
        ctx.textAlign = 'center';
        const date = new Date().toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        ctx.fillText(date, mergeCanvas.width/2, mergeCanvas.height - padding/2);

        // สร้างลิงก์ดาวน์โหลด
        const link = document.createElement('a');
        link.download = `photobooth-${selectedFrame}-${Date.now()}.jpg`;
        link.href = mergeCanvas.toDataURL('image/jpeg', 1.0); // เพิ่มคุณภาพเป็นสูงสุด
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

// เพิ่ม touch events สำหรับปุ่มต่างๆ
document.querySelectorAll('.btn, .frame-option, .delete-btn').forEach(el => {
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        el.style.transform = 'scale(0.95)';
    });

    el.addEventListener('touchend', (e) => {
        e.preventDefault();
        el.style.transform = 'scale(1)';
    });
});

// เพิ่มการจัดการ orientation change
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // รอให้หน้าจอหมุนเสร็จก่อนจัดการ layout ใหม่
        const video = document.getElementById('video');
        video.style.height = 'auto';
    }, 200);
});

// Initialize camera
initCamera();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
