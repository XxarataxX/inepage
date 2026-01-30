// Configuración global
const VERIFICAMEX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzc4M2ZkYzRkMGY4MDFhNjFhNjQwZjhiMzdiMjc5MTY3NDMxMTQ3NzZiY2M3ZmQyNThiMDJhNmI2MjYwY2Q5ODIwNzcwZTgyYmYxYzY0MTEiLCJpYXQiOjE3Njk3OTYxNzguMDg3OTA3LCJuYmYiOjE3Njk3OTYxNzguMDg3OTMxLCJleHAiOjE4MDEzMzIxNzguMDUxNDc5LCJzdWIiOiI5MTEzIiwic2NvcGVzIjpbXX0.k6Bwb4JlPLI2PVm9Uv27MfWhD-goR962rK51CZYwOvUhPthlnPUy4pBQaOvdKzG4TzzHgqkBci8lcvKk2yBWGzD3ipAIxnsF-yApCezgTiy9BvG7rh6QOtwju4s0muURLiynxUc9enyoyT71bAslnIAquBcYVJFVOhr6iGdyEg_GQ53AlMkHjwazv5itgT0VOAheGErgtrJsNuAqt-BfWQrPxzWVyUzYPXJCCN4tOThWexazU8j6yFvYQB6Jjn507b4iMbyZxUwB4-6DOEdNQikCuxYTK6omIo-noCgZ-LQGNm39GgaJXKtZm-p1v8Nbsnd8yU3pgDIdNwvsxnynuF_AE4glKFJZdezUXZ9qdUw_fZCUK50G-BIYrhCWksZ6ibppWtopD4oG4ghGPXT12CP1m1mg8COfvVU72YPXTa6SfGCJ9IWsnkPTZli2eb4ilxXAv9IIoPgtGbVNFokjiZsgdbELxjevhc7JIRc3hSC8apbd4lKgvBp8D_PiXdUX5-rOEVrlP7e5Av4dBaXJVMjOYgOOdzCDxN_y5HOG2KxmowCMSkXq7yusNv_ZfQKZRAAquVDLCZ9fKbMD9EqRgqj3AXf1sLSteYhWs4UbNQwhIC06PXL2LDTcHyvf7HBNeWiXlwiXCgQpfWgJUE58_-lhyNlrfZs-PPqkg4b0xdA";
let photos = {
    ine_front: null,
    ine_back: null,
    selfie: null
};

let currentStep = 1;

// Inicializar cámaras
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar token (oculto parcialmente)
    const tokenPreview = document.getElementById('token-preview');
    if (VERIFICAMEX_TOKEN) {
        const visiblePart = VERIFICAMEX_TOKEN.substring(0, 10);
        tokenPreview.textContent = visiblePart + '...';
    }
    
    // Iniciar cámara del paso 1
    initCamera(1);
    
    // Mostrar solo el primer paso
    showStep(1);
});

// Inicializar cámara
async function initCamera(stepNumber) {
    try {
        const video = document.getElementById(`video${stepNumber}`);
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: stepNumber === 3 ? 'user' : 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            }
        });
        video.srcObject = stream;
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('Error al acceder a la cámara. Asegúrate de dar permisos.');
    }
}

// Capturar foto - CORREGIDO: Mantener formato data URL completo
function capturePhoto(stepNumber) {
    const video = document.getElementById(`video${stepNumber}`);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // REDUCIR TAMAÑO
    const maxWidth = 640;
    const maxHeight = 480;
    
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Dibujar frame
    context.drawImage(video, 0, 0, width, height);
    
    // Convertir a data URL COMPLETO (IMPORTANTE: mantener formato completo)
    const imageData = canvas.toDataURL('image/jpeg', 0.7); // data:image/jpeg;base64,xxxxxxxx
    
    console.log(`Foto ${stepNumber} capturada:`);
    console.log(`- Dimensiones: ${width}x${height}`);
    console.log(`- Data URL length: ${imageData.length} caracteres`);
    console.log(`- Formato: ${imageData.substring(0, 50)}...`);
    
    // Guardar el data URL COMPLETO (no extraer solo base64)
    switch(stepNumber) {
        case 1:
            photos.ine_front = imageData;
            break;
        case 2:
            photos.ine_back = imageData;
            break;
        case 3:
            photos.selfie = imageData;
            break;
    }
    
    // Mostrar preview
    const preview = document.getElementById(`preview${stepNumber}`);
    preview.innerHTML = `<img src="${imageData}" alt="Foto ${stepNumber}" style="max-width: 200px;">`;
    
    // Avanzar al siguiente paso
    setTimeout(() => {
        showStep(stepNumber + 1);
        if (stepNumber < 3) {
            initCamera(stepNumber + 1);
        }
    }, 500);
}

// Mostrar paso específico
function showStep(step) {
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        stepEl.classList.remove('active');
    }
    
    const currentStepEl = document.getElementById(`step${step}`);
    currentStepEl.classList.add('active');
    currentStep = step;
}

// Función para test con data URL correcto
function testSimpleEndpoint() {
    console.log('=== TEST CON FORMATO CORRECTO ===');
    
    // Crear una imagen pequeña de prueba en formato data URL
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText('TEST', 20, 50);
    
    const testImage = canvas.toDataURL('image/jpeg', 0.5);
    console.log('Test image data URL:', testImage.substring(0, 100) + '...');
    
    fetch('https://api.verificamex.com/identity/v1/ocr/obverse', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VERIFICAMEX_TOKEN}`
        },
        body: JSON.stringify({
            ine_front: testImage
        })
    })
    .then(response => {
        console.log('Test status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Test response:', data);
        alert('✅ OCR funciona! Ver consola para detalles.');
    })
    .catch(error => {
        console.error('Test error:', error);
        alert('❌ Error: ' + error.message);
    });
}