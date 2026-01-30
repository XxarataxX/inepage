// Configuración global
const VERIFICAMEX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzc4M2ZkYzRkMGY4MDFhNjFhNjQwZjhiMzdiMjc5MTY3NDMxMTQ3NzZiY2M3ZmQyNThiMDJhNmI2MjYwY2Q5ODIwNzcwZTgyYmYxYzY0MTEiLCJpYXQiOjE3Njk3OTYxNzguMDg3OTA3LCJuYmYiOjE3Njk3OTYxNzguMDg3OTMxLCJleHAiOjE4MDEzMzIxNzguMDUxNDc5LCJzdWIiOiI5MTEzIiwic2NvcGVzIjpbXX0.k6Bwb4JlPLI2PVm9Uv27MfWhD-goR962rK51CZYwOvUhPthlnPUy4pBQaOvdKzG4TzzHgqkBci8lcvKk2yBWGzD3ipAIxnsF-yApCezgTiy9BvG7rh6QOtwju4s0muURLiynxUc9enyoyT71bAslnIAquBcYVJFVOhr6iGdyEg_GQ53AlMkHjwazv5itgT0VOAheGErgtrJsNuAqt-BfWQrPxzWVyUzYPXJCCN4tOThWexazU8j6yFvYQB6Jjn507b4iMbyZxUwB4-6DOEdNQikCuxYTK6omIo-noCgZ-LQGNm39GgaJXKtZm-p1v8Nbsnd8yU3pgDIdNwvsxnynuF_AE4glKFJZdezUXZ9qdUw_fZCUK50G-BIYrhCWksZ6ibppWtopD4oG4ghGPXT12CP1m1mg8COfvVU72YPXTa6SfGCJ9IWsnkPTZli2eb4ilxXAv9IIoPgtGbVNFokjiZsgdbELxjevhc7JIRc3hSC8apbd4lKgvBp8D_PiXdUX5-rOEVrlP7e5Av4dBaXJVMjOYgOOdzCDxN_y5HOG2KxmowCMSkXq7yusNv_ZfQKZRAAquVDLCZ9fKbMD9EqRgqj3AXf1sLSteYhWs4UbNQwhIC06PXL2LDTcHyvf7HBNeWiXlwiXCgQpfWgJUE58_-lhyNlrfZs-PPqkg4b0xdA";

let photos = {
    ine_front: null,
    ine_back: null,
    selfie: null
};

let currentStep = 1;
let cameraStream = null;
let currentCameraType = 'back'; // 'back' o 'front'

// ============================================
// INICIALIZACIÓN
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
    
    // Iniciar cámara trasera automáticamente (para fotos INE)
    initCamera('back');
});

// ============================================
// FUNCIONES PARA INICIAR CÁMARAS
// ============================================

async function initCamera(cameraType) {
    try {
        console.log(`=== INICIANDO CÁMARA ${cameraType.toUpperCase()} ===`);
        
        // Detener stream anterior si existe
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        
        let constraints;
        
        if (cameraType === 'back') {
            // Cámara trasera para fotos INE
            constraints = {
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 24 }
                },
                audio: false
            };
        } else {
            // Cámara frontal para selfie
            constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 24 }
                },
                audio: false
            };
        }
        
        console.log('Solicitando cámara con:', constraints);
        
        // Obtener stream
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentCameraType = cameraType;
        
        console.log(`✅ Cámara ${cameraType} obtenida correctamente`);
        
        // Asignar a TODOS los videos (mismo stream para todos)
        for (let i = 1; i <= 3; i++) {
            const video = document.getElementById(`video${i}`);
            if (video) {
                video.srcObject = cameraStream;
                
                // Forzar reproducción
                video.play().catch(e => {
                    console.log(`Video ${i} play error:`, e);
                    video.muted = true;
                    video.play();
                });
            }
        }
        
        // Actualizar estado
        const cameraName = cameraType === 'back' ? 'Trasera ✅' : 'Frontal ✅';
        updateCameraStatus(cameraName);
        updateLastAction(`Cámara ${cameraType === 'back' ? 'trasera' : 'frontal'} lista`);
        return true;
        
    } catch (error) {
        console.error(`❌ ERROR iniciando cámara ${cameraType}:`, error);
        
        let errorMessage = `Error con la cámara ${cameraType}: `;
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Permiso denegado. Por favor permite el acceso a la cámara.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = `No se encontró cámara ${cameraType}.`;
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = `Cámara ${cameraType} no disponible.`;
        } else {
            errorMessage += error.message;
        }
        
        // Intentar con la otra cámara como fallback
        const fallbackType = cameraType === 'back' ? 'front' : 'back';
        console.log(`Intentando fallback con cámara ${fallbackType}...`);
        
        try {
            const fallbackConstraints = {
                video: {
                    facingMode: fallbackType === 'back' ? { ideal: 'environment' } : 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            };
            
            cameraStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            currentCameraType = fallbackType;
            
            // Asignar a videos
            for (let i = 1; i <= 3; i++) {
                const video = document.getElementById(`video${i}`);
                if (video) {
                    video.srcObject = cameraStream;
                    video.play();
                }
            }
            
            const fallbackName = fallbackType === 'back' ? 'Trasera (fallback) ✅' : 'Frontal (fallback) ✅';
            console.log(`✅ Cámara ${fallbackType} iniciada como fallback`);
            updateCameraStatus(fallbackName);
            updateLastAction(`Cámara ${fallbackType} activada como fallback`);
            return true;
            
        } catch (fallbackError) {
            console.error('Error incluso con fallback:', fallbackError);
            alert(errorMessage + '\n\nPuedes usar imágenes de prueba mientras solucionamos esto.');
            updateCameraStatus('Sin cámara ❌');
            updateLastAction('Error en ambas cámaras');
            return false;
        }
    }
}

// ============================================
// FUNCIÓN DE CAPTURA
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
        
        // Dibujar video en canvas
        context.drawImage(video, 0, 0, width, height);
        
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
                    ✅ ${getStepName(stepNumber)} capturada
                </p>
                <p style="font-size: 12px; color: #666;">
                    (Cámara ${stepNumber === 3 ? 'frontal' : 'trasera'})
                </p>
            </div>
        `;
        
        updateLastAction(`${getStepName(stepNumber)} capturada con cámara ${stepNumber === 3 ? 'frontal' : 'trasera'}`);
        
        // Si estamos en paso 2 (INE trasero), cambiar a cámara frontal para el selfie
        if (stepNumber === 2) {
            console.log('Cambiando a cámara frontal para selfie...');
            setTimeout(() => {
                initCamera('front');
            }, 300);
        }
        
        // Avanzar al siguiente paso
        setTimeout(() => {
            showStep(stepNumber + 1);
        }, 800);
        
    } catch (error) {
        console.error('Error capturando foto:', error);
        alert('Error al capturar la foto: ' + error.message);
        updateLastAction('Error capturando foto');
    }
}

// Obtener nombre del paso
function getStepName(stepNumber) {
    switch(stepNumber) {
        case 1: return 'INE Frontal';
        case 2: return 'INE Trasero';
        case 3: return 'Selfie';
        default: return 'Foto';
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
    
    // Actualizar mensaje de cámara
    updateCameraMessage(step);
}

// Actualizar mensaje sobre qué cámara se usa
function updateCameraMessage(step) {
    const messageDiv = document.getElementById('camera-message');
    if (!messageDiv) return;
    
    if (step === 3) {
        messageDiv.innerHTML = `
            <div style="background: #e3f2fd; padding: 8px; border-radius: 4px; margin: 10px 0;">
                <strong>📱 Selfie con cámara frontal:</strong> 
                <span style="color: #1976d2;">Mírate a la cámara frontal del dispositivo</span>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div style="background: #f3e5f5; padding: 8px; border-radius: 4px; margin: 10px 0;">
                <strong>📷 Cámara trasera:</strong> 
                <span style="color: #7b1fa2;">Apoya el INE sobre una superficie plana</span>
            </div>
        `;
    }
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
    updateLastAction('Reiniciando cámara...');
    
    // Determinar qué cámara usar según el paso actual
    const cameraType = currentStep === 3 ? 'front' : 'back';
    
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
    
    // Reiniciar con la cámara apropiada
    const result = await initCamera(cameraType);
    if (result) {
        updateLastAction(`Cámara ${cameraType} reiniciada`);
    }
    return result;
}

// Función para usar imagen de prueba
function useTestImage(stepNumber) {
    console.log(`Usando imagen de prueba para paso ${stepNumber}`);
    
    // Determinar qué tipo de cámara se debería usar
    const cameraType = stepNumber === 3 ? 'front' : 'back';
    updateLastAction(`Usando imagen de prueba (cámara ${cameraType})`);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (stepNumber === 1 || stepNumber === 2) {
        // INE con cámara trasera
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
        // Selfie con cámara frontal
        canvas.width = 300;
        canvas.height = 300;
        
        // Fondo de selfie con cámara frontal
        ctx.fillStyle = '#4fc3f7';
        ctx.fillRect(0, 0, 300, 300);
        
        // Cara (vista frontal)
        ctx.fillStyle = '#ffccbc';
        ctx.beginPath();
        ctx.arc(150, 120, 50, 0, Math.PI * 2); // Cara
        ctx.fill();
        
        // Ojos
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(130, 110, 8, 0, Math.PI * 2); // Ojo izquierdo
        ctx.arc(170, 110, 8, 0, Math.PI * 2); // Ojo derecho
        ctx.fill();
        
        // Sonrisa
        ctx.beginPath();
        ctx.arc(150, 140, 20, 0, Math.PI, false); // Sonrisa
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#37474f';
        ctx.stroke();
        
        // Indicador de selfie con cámara frontal
        ctx.fillStyle = '#0d47a1';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('SELFIE CON CÁMARA FRONTAL', 60, 250);
        
        // Icono de cámara frontal
        ctx.fillStyle = '#ff4081';
        ctx.beginPath();
        ctx.arc(260, 40, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText('📱', 255, 45);
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
            <p style="font-size: 12px; color: #666;">
                (Cámara ${stepNumber === 3 ? 'frontal' : 'trasera'})
            </p>
        </div>
    `;
    
    // Si estamos en paso 2, simular cambio a cámara frontal para paso 3
    if (stepNumber === 2) {
        console.log('Simulando cambio a cámara frontal para selfie...');
        setTimeout(() => {
            // Cambiar mensaje de cámara
            updateCameraMessage(3);
        }, 300);
    }
    
    // Avanzar
    setTimeout(() => {
        showStep(stepNumber + 1);
    }, 500);
}

// Saltar paso
function skipStep(stepNumber) {
    console.log(`Saltando paso ${stepNumber}`);
    updateLastAction(`Saltando paso ${stepNumber}`);
    
    // Si saltamos el paso 2, asegurarnos de cambiar a cámara frontal para el paso 3
    if (stepNumber === 2) {
        console.log('Cambiando a cámara frontal para selfie...');
        setTimeout(() => {
            initCamera('front');
        }, 100);
    }
    
    showStep(stepNumber + 1);
}

// Reiniciar demo completa
function resetDemo() {
    console.log('=== REINICIANDO DEMO COMPLETA ===');
    updateLastAction('Reiniciando demo...');
    
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
    
    // Limpiar mensaje de cámara
    const messageDiv = document.getElementById('camera-message');
    if (messageDiv) messageDiv.innerHTML = '';
    
    // Ocultar loading
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    // Volver al paso 1
    showStep(1);
    
    // Reiniciar cámara trasera (para fotos INE)
    setTimeout(() => {
        initCamera('back');
    }, 300);
    
    console.log('Demo reiniciada');
    updateLastAction('Demo reiniciada con cámara trasera');
}

// ============================================
// FUNCIONES DE ESTADO
// ============================================

function updateCameraStatus(status) {
    const statusEl = document.getElementById('camera-status');
    if (statusEl) statusEl.textContent = status;
}

function updateLastAction(action) {
    const actionEl = document.getElementById('last-action');
    if (actionEl) actionEl.textContent = action;
}

// ============================================
// HACER FUNCIONES GLOBALES
// ============================================

window.initCamera = initCamera;
window.restartCamera = restartCamera;
window.useTestImage = useTestImage;
window.skipStep = skipStep;
window.resetDemo = resetDemo;
window.capturePhoto = capturePhoto;
window.showStep = showStep;