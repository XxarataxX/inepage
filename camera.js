// Configuración global
const VERIFICAMEX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzc4M2ZkYzRkMGY4MDFhNjFhNjQwZjhiMzdiMjc5MTY3NDMxMTQ3NzZiY2M3ZmQyNThiMDJhNmI2MjYwY2Q5ODIwNzcwZTgyYmYxYzY0MTEiLCJpYXQiOjE3Njk3OTYxNzguMDg3OTA3LCJuYmYiOjE3Njk3OTYxNzguMDg3OTMxLCJleHAiOjE4MDEzMzIxNzguMDUxNDc5LCJzdWIiOiI5MTEzIiwic2NvcGVzIjpbXX0.k6Bwb4JlPLI2PVm9Uv27MfWhD-goR962rK51CZYwOvUhPthlnPUy4pBQaOvdKzG4TzzHgqkBci8lcvKk2yBWGzD3ipAIxnsF-yApCezgTiy9BvG7rh6QOtwju4s0muURLiynxUc9enyoyT71bAslnIAquBcYVJFVOhr6iGdyEg_GQ53AlMkHjwazv5itgT0VOAheGErgtrJsNuAqt-BfWQrPxzWVyUzYPXJCCN4tOThWexazU8j6yFvYQB6Jjn507b4iMbyZxUwB4-6DOEdNQikCuxYTK6omIo-noCgZ-LQGNm39GgaJXKtZm-p1v8Nbsnd8yU3pgDIdNwvsxnynuF_AE4glKFJZdezUXZ9qdUw_fZCUK50G-BIYrhCWksZ6ibppWtopD4oG4ghGPXT12CP1m1mg8COfvVU72YPXTa6SfGCJ9IWsnkPTZli2eb4ilxXAv9IIoPgtGbVNFokjiZsgdbELxjevhc7JIRc3hSC8apbd4lKgvBp8D_PiXdUX5-rOEVrlP7e5Av4dBaXJVMjOYgOOdzCDxN_y5HOG2KxmowCMSkXq7yusNv_ZfQKZRAAquVDLCZ9fKbMD9EqRgqj3AXf1sLSteYhWs4UbNQwhIC06PXL2LDTcHyvf7HBNeWiXlwiXCgQpfWgJUE58_-lhyNlrfZs-PPqkg4b0xdA";

let photos = {
    ine_front: null,
    ine_back: null,
    selfie: null
};

let currentStep = 1;
let cameraStream = null;

// ============================================
// INICIALIZACIÓN SIMPLIFICADA
// ============================================

// Inicializar cámaras
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar token (oculto parcialmente)
    const tokenPreview = document.getElementById('token-preview');
    if (VERIFICAMEX_TOKEN) {
        const visiblePart = VERIFICAMEX_TOKEN.substring(0, 10);
        tokenPreview.textContent = visiblePart + '...';
    }
    
    // Mostrar solo el primer paso
    showStep(1);
    
    // Iniciar cámara frontal automáticamente
    initFrontCamera();
});

// ============================================
// FUNCIÓN ÚNICA PARA INICIAR CÁMARA FRONTAL
// ============================================

async function initFrontCamera() {
    try {
        console.log('=== INICIANDO CÁMARA FRONTAL ===');
        
        // Detener stream anterior si existe
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        
        // Configuración optimizada para móvil
        const constraints = {
            video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 24 }
            },
            audio: false
        };
        
        console.log('Solicitando cámara frontal con:', constraints);
        
        // Obtener stream
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        console.log('✅ Cámara frontal obtenida correctamente');
        
        // Asignar a TODOS los videos (mismo stream para todos)
        for (let i = 1; i <= 3; i++) {
            const video = document.getElementById(`video${i}`);
            if (video) {
                video.srcObject = cameraStream;
                
                // Para selfie (paso 3), aplicar espejo
                if (i === 3) {
                    video.style.transform = 'scaleX(-1)';
                }
                
                // Forzar reproducción
                video.play().catch(e => {
                    console.log(`Video ${i} play error:`, e);
                    video.muted = true;
                    video.play();
                });
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ ERROR iniciando cámara frontal:', error);
        
        let errorMessage = 'Error con la cámara frontal: ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Permiso denegado. Por favor permite el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No se encontró cámara frontal.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage + '\n\nPuedes usar imágenes de prueba mientras solucionamos esto.');
        return false;
    }
}

// ============================================
// FUNCIÓN DE CAPTURA SIMPLIFICADA
// ============================================

function capturePhoto(stepNumber) {
    try {
        console.log(`Capturando foto para paso ${stepNumber}`);
        
        const video = document.getElementById(`video${stepNumber}`);
        
        if (!video || !cameraStream) {
            alert('La cámara no está lista. Intenta de nuevo.');
            return;
        }
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Tamaño fijo para consistencia
        const width = 640;
        const height = 480;
        
        canvas.width = width;
        canvas.height = height;
        
        // Para selfie, mantener espejo natural
        if (stepNumber === 3) {
            // Selfie: mantener orientación normal (ya está espejado en video)
            context.drawImage(video, 0, 0, width, height);
        } else {
            // INE: rotar si es necesario (para documento físico)
            context.drawImage(video, 0, 0, width, height);
        }
        
        // Convertir a data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        
        console.log(`Foto ${stepNumber} capturada:`, imageData.length, 'caracteres');
        
        // Guardar
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
        preview.innerHTML = `
            <div style="text-align: center;">
                <img src="${imageData}" alt="Foto ${stepNumber}" 
                     style="max-width: 200px; border-radius: 8px; border: 2px solid #28a745;">
                <p style="margin-top: 5px; font-size: 14px; color: #28a745;">
                    ✅ ${stepNumber === 3 ? 'Selfie' : 'INE'} capturada
                </p>
            </div>
        `;
        
        // Avanzar al siguiente paso
        setTimeout(() => {
            showStep(stepNumber + 1);
        }, 500);
        
    } catch (error) {
        console.error('Error capturando foto:', error);
        alert('Error al capturar la foto: ' + error.message);
    }
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

// Mostrar paso específico
function showStep(step) {
    console.log(`Mostrando paso ${step}`);
    
    // Ocultar todos los pasos
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        if (stepEl) stepEl.classList.remove('active');
    }
    
    // Mostrar paso actual
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
        currentStep = step;
    }
    
    // Actualizar indicador de paso
    updateStepIndicator(step);
}

// Actualizar indicador visual
function updateStepIndicator(step) {
    const indicator = document.getElementById('step-indicator');
    if (indicator) {
        indicator.textContent = `Paso ${step} de 4`;
    }
}

// Reiniciar cámara
async function restartCamera() {
    console.log('Reiniciando cámara...');
    
    // Detener stream actual
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    // Limpiar videos
    for (let i = 1; i <= 3; i++) {
        const video = document.getElementById(`video${i}`);
        if (video) {
            video.srcObject = null;
        }
    }
    
    // Pequeña pausa
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reiniciar
    return await initFrontCamera();
}

// Función para usar imagen de prueba
function useTestImage(stepNumber) {
    console.log(`Usando imagen de prueba para paso ${stepNumber}`);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (stepNumber === 1 || stepNumber === 2) {
        // INE
        canvas.width = 400;
        canvas.height = 250;
        
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#0066cc';
        ctx.fillRect(0, 0, 400, 60);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('INE DE PRUEBA', 20, 35);
        
        ctx.fillStyle = 'black';
        ctx.font = '14px Arial';
        ctx.fillText('Nombre: PRUEBA DEMO', 20, 100);
        ctx.fillText('CURP: DEMO010101HDEMOO01', 20, 130);
        ctx.fillText('Dirección: CALLE DEMO 123', 20, 160);
        
    } else if (stepNumber === 3) {
        // Selfie
        canvas.width = 300;
        canvas.height = 300;
        
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, 300, 300);
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(150, 150, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(120, 130, 10, 0, Math.PI * 2);
        ctx.arc(180, 130, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(150, 180, 30, 0, Math.PI);
        ctx.stroke();
    }
    
    const testImage = canvas.toDataURL('image/jpeg', 0.8);
    
    // Guardar
    switch(stepNumber) {
        case 1:
            photos.ine_front = testImage;
            break;
        case 2:
            photos.ine_back = testImage;
            break;
        case 3:
            photos.selfie = testImage;
            break;
    }
    
    // Mostrar preview
    const preview = document.getElementById(`preview${stepNumber}`);
    preview.innerHTML = `
        <div style="text-align: center;">
            <img src="${testImage}" alt="Prueba ${stepNumber}" 
                 style="max-width: 200px; border-radius: 8px;">
            <p style="margin-top: 5px; font-size: 14px; color: #17a2b8;">
                🧪 Imagen de prueba
            </p>
        </div>
    `;
    
    // Avanzar
    setTimeout(() => {
        showStep(stepNumber + 1);
    }, 500);
}

// Saltar paso
function skipStep(stepNumber) {
    console.log(`Saltando paso ${stepNumber}`);
    showStep(stepNumber + 1);
}

// Reiniciar demo completa
function resetDemo() {
    console.log('=== REINICIANDO DEMO COMPLETA ===');
    
    // Resetear fotos
    photos = {
        ine_front: null,
        ine_back: null,
        selfie: null
    };
    
    // Limpiar previews
    for (let i = 1; i <= 3; i++) {
        const preview = document.getElementById(`preview${i}`);
        if (preview) preview.innerHTML = '';
    }
    
    // Limpiar resultados
    const resultDiv = document.getElementById('result');
    if (resultDiv) resultDiv.innerHTML = '';
    
    // Ocultar loading
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    // Volver al paso 1
    showStep(1);
    
    // Reiniciar cámara
    setTimeout(() => {
        restartCamera();
    }, 300);
    
    console.log('Demo reiniciada');
}

// ============================================
// FUNCIONES GLOBALES
// ============================================

window.initFrontCamera = initFrontCamera;
window.restartCamera = restartCamera;
window.useTestImage = useTestImage;
window.skipStep = skipStep;
window.resetDemo = resetDemo;