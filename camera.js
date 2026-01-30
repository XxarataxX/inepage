// Configuración global
const VERIFICAMEX_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiNzc4M2ZkYzRkMGY4MDFhNjFhNjQwZjhiMzdiMjc5MTY3NDMxMTQ3NzZiY2M3ZmQyNThiMDJhNmI2MjYwY2Q5ODIwNzcwZTgyYmYxYzY0MTEiLCJpYXQiOjE3Njk3OTYxNzguMDg3OTA3LCJuYmYiOjE3Njk3OTYxNzguMDg3OTMxLCJleHAiOjE4MDEzMzIxNzguMDUxNDc5LCJzdWIiOiI5MTEzIiwic2NxpG9yZXMiOltdfQ.k6Bwb4JlPLI2PVm9Uv27MfWhD-goR962rK51CZYwOvUhPthlnPUy4pBQaOvdKzG4TzzHgqkBci8lcvKk2yBWGzD3ipAIxnsF-yApCezgTiy9BvG7rh6QOtwju4s0muURLiynxUc9enyoyT71bAslnIAquBcYVJFVOhr6iGdyEg_GQ53AlMkHjwazv5itgT0VOAheGErgtrJsNuAqt-BfWQrPxzWVyUzYPXJCCN4tOThWexazU8j6yFvYQB6Jjn507b4iMbyZxUwB4-6DOEdNQikCuxYTK6omIo-noCgZ-LQGNm39GgaJXKtZm-p1v8Nbsnd8yU3pgDIdNwvsxnynuF_AE4glKFJZdezUXZ9qdUw_fZCUK50G-BIYrhCWksZ6ibppWtopD4oG4ghGPXT12CP1m1mg8COfvVU72YPXTa6SfGCJ9IWsnkPTZli2eb4ilxXAv9IIoPgtGbVNFokjiZsgdbELxjevhc7JIRc3hSC8apbd4lKgvBp8D_PiXdUX5-rOEVrlP7e5Av4dBaXJVMjOYgOOdzCDxN_y5HOG2KxmowCMSkXq7yusNv_ZfQKZRAAquVDLCZ9fKbMD9EqRgqj3AXf1sLSteYhWs4UbNQwhIC06PXL2LDTcHyvf7HBNeWiXlwiXCgQpfWgJUE58_-lhyNlrfZs-PPqkg4b0xdA";

let photos = {
    ine_front: null,
    ine_back: null,
    selfie: null
};

let currentStep = 1;
let activeStreams = {}; // Nuevo: rastrear streams activos por paso

// ============================================
// NUEVAS FUNCIONES PARA MANEJAR STREAMS
// ============================================

// Detener todos los streams activos
function stopAllStreams() {
    console.log('Deteniendo todos los streams...');
    
    // Detener cada stream en activeStreams
    Object.keys(activeStreams).forEach(stepKey => {
        const stream = activeStreams[stepKey];
        if (stream) {
            stream.getTracks().forEach(track => {
                console.log(`Deteniendo track ${track.kind} del paso ${stepKey}`);
                track.stop();
            });
        }
    });
    
    // Limpiar el objeto
    activeStreams = {};
    
    // También limpiar cualquier stream global antiguo
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
        window.currentStream = null;
    }
    
    // Limpiar todos los elementos de video
    [1, 2, 3].forEach(num => {
        const video = document.getElementById(`video${num}`);
        if (video) {
            video.srcObject = null;
            video.pause();
        }
    });
    
    console.log('Todos los streams detenidos');
}

// Detener stream específico
function stopStream(stepNumber) {
    const streamKey = `step${stepNumber}`;
    if (activeStreams[streamKey]) {
        console.log(`Deteniendo stream del paso ${stepNumber}`);
        activeStreams[streamKey].getTracks().forEach(track => track.stop());
        delete activeStreams[streamKey];
    }
}

// ============================================
// INICIALIZACIÓN MODIFICADA
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
    
    // NO iniciar cámara automáticamente - esperar a que el usuario de clic
    console.log('Listo para iniciar cámara cuando el usuario lo solicite');
});

// ============================================
// FUNCIÓN DE INICIALIZACIÓN DE CÁMARA MEJORADA
// ============================================

// Inicializar cámara - VERSIÓN MEJORADA
async function initCamera(stepNumber) {
    try {
        console.log(`=== INICIANDO CÁMARA PARA PASO ${stepNumber} ===`);
        
        // 1. PRIMERO detener cualquier stream activo
        stopAllStreams();
        
        // 2. Pequeña pausa para que el sistema libere las cámaras
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const video = document.getElementById(`video${stepNumber}`);
        
        // 3. Configurar según el paso
        let constraints;
        
        if (stepNumber === 3) {
            // SELFIE: cámara frontal
            console.log('Configurando cámara frontal para selfie');
            constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 24 }
                }
            };
            
            // Para iOS/Android, ser más específico
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                constraints.video.facingMode = { exact: 'user' };
            }
            
        } else {
            // INE: cámara trasera
            console.log('Configurando cámara trasera para INE');
            constraints = {
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: { ideal: 'environment' },
                    frameRate: { ideal: 24 }
                }
            };
        }
        
        console.log('Constraints:', constraints);
        
        // 4. Solicitar stream
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 5. Guardar referencia
        const streamKey = `step${stepNumber}`;
        activeStreams[streamKey] = stream;
        
        // 6. Asignar al video
        video.srcObject = stream;
        
        // 7. Forzar reproducción (especialmente en iOS)
        video.play().catch(e => {
            console.warn('Error en video.play():', e);
            // Intentar de nuevo con muted
            video.muted = true;
            video.play();
        });
        
        console.log(`✅ Cámara iniciada correctamente para paso ${stepNumber}`);
        
        return true;
        
    } catch (error) {
        console.error(`❌ ERROR iniciando cámara paso ${stepNumber}:`, error);
        
        // Mostrar mensaje de error específico
        let errorMessage = 'Error con la cámara: ';
        
        if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = 'La cámara está siendo usada por otra aplicación. ';
            errorMessage += 'Por favor:\n1. Cierra otras pestañas que usen cámara\n2. Recarga esta página\n3. Intenta de nuevo';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No se encontró la cámara solicitada.';
        } else if (error.name === 'NotAllowedError') {
            errorMessage = 'Permiso denegado. Asegúrate de permitir el acceso a la cámara.';
        } else if (error.name === 'OverconstrainedError') {
            errorMessage = 'Configuración de cámara no soportada. Usando configuración por defecto.';
            // Intentar con constraints más simples
            return await initCameraSimple(stepNumber);
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        return false;
    }
}

// Función alternativa con constraints más simples
async function initCameraSimple(stepNumber) {
    try {
        console.log('Intentando con constraints simples...');
        
        const video = document.getElementById(`video${stepNumber}`);
        
        // Constraints MUY simples
        const constraints = {
            video: {
                facingMode: stepNumber === 3 ? 'user' : 'environment'
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const streamKey = `step${stepNumber}`;
        activeStreams[streamKey] = stream;
        
        video.srcObject = stream;
        video.play();
        
        console.log('✅ Cámara iniciada con constraints simples');
        return true;
        
    } catch (error) {
        console.error('Error incluso con constraints simples:', error);
        return false;
    }
}

// ============================================
// FUNCIÓN DE CAPTURA MEJORADA
// ============================================

// Capturar foto - VERSIÓN MEJORADA
function capturePhoto(stepNumber) {
    try {
        console.log(`=== CAPTURANDO FOTO PASO ${stepNumber} ===`);
        
        const video = document.getElementById(`video${stepNumber}`);
        
        if (!video.srcObject) {
            alert('Primero inicia la cámara');
            return;
        }
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // REDUCIR TAMAÑO
        const maxWidth = 640;
        const maxHeight = 480;
        
        let width = video.videoWidth || 640;
        let height = video.videoHeight || 480;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Para selfie, espejar la imagen (como un espejo)
        if (stepNumber === 3) {
            context.translate(canvas.width, 0);
            context.scale(-1, 1);
        }
        
        // Dibujar frame
        context.drawImage(video, 0, 0, width, height);
        
        // Restaurar transformación si se aplicó
        if (stepNumber === 3) {
            context.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        // Convertir a data URL
        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        
        console.log(`Foto ${stepNumber} capturada:`, {
            dimensiones: `${width}x${height}`,
            tamaño: `${imageData.length} caracteres`,
            preview: imageData.substring(0, 80) + '...'
        });
        
        // Guardar el data URL COMPLETO
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
                    ✅ Foto ${stepNumber} capturada
                </p>
            </div>
        `;
        
        // 1. Detener el stream de ESTE paso
        stopStream(stepNumber);
        
        // 2. Avanzar al siguiente paso
        setTimeout(() => {
            showStep(stepNumber + 1);
            
            // 3. Si hay siguiente paso y NO es selfie (paso 3 ya pasó), iniciar cámara
            if (stepNumber < 3) {
                // Pequeña pausa antes de iniciar nueva cámara
                setTimeout(() => {
                    initCamera(stepNumber + 1);
                }, 500);
            }
        }, 500);
        
    } catch (error) {
        console.error('Error capturando foto:', error);
        alert('Error al capturar la foto: ' + error.message);
    }
}

// ============================================
// NUEVAS FUNCIONES DE UTILIDAD
// ============================================

// Función para forzar reinicio de cámaras
function forceCameraReset() {
    console.log('=== REINICIO FORZADO DE CÁMARAS ===');
    stopAllStreams();
    alert('Todas las cámaras han sido reiniciadas. Ahora puedes intentar de nuevo.');
}

// Verificar estado de cámaras
function checkCameraStatus() {
    console.log('=== ESTADO DE CÁMARAS ===');
    console.log('Streams activos:', Object.keys(activeStreams).length);
    console.log('activeStreams:', activeStreams);
    
    // Verificar cada video element
    [1, 2, 3].forEach(num => {
        const video = document.getElementById(`video${num}`);
        console.log(`Video ${num}:`, {
            srcObject: video?.srcObject ? 'Presente' : 'Ausente',
            readyState: video?.readyState,
            paused: video?.paused
        });
    });
}

// ============================================
// FUNCIONES DE NAVEGACIÓN MODIFICADAS
// ============================================

// Mostrar paso específico
function showStep(step) {
    console.log(`Mostrando paso ${step}`);
    
    // Detener cualquier cámara activa al cambiar de paso
    stopAllStreams();
    
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
    
    // Si es un paso con cámara (1, 2, 3) y NO es selfie, iniciar automáticamente
    if (step <= 3 && step !== 3) {
        // Pequeña pausa antes de iniciar cámara
        setTimeout(() => {
            initCamera(step);
        }, 300);
    }
}

// ============================================
// FUNCIÓN PARA SELFIE MEJORADA
// ============================================

// Función especial para iniciar cámara frontal
async function startFrontCamera() {
    console.log('=== INICIANDO CÁMARA FRONTAL PARA SELFIE ===');
    
    try {
        // 1. Detener todo
        stopAllStreams();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const video = document.getElementById('video3');
        
        // 2. Intentar con constraints específicos para frontal
        let stream;
        
        try {
            // Primero intentar con facingMode exact
            stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: { exact: 'user' }
                }
            });
        } catch (exactError) {
            console.log('Falló facingMode exact, intentando simple...');
            // Si falla, intentar simple
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
        }
        
        // 3. Guardar y asignar
        activeStreams.step3 = stream;
        video.srcObject = stream;
        
        // 4. Forzar play (especialmente iOS)
        video.play().catch(e => {
            video.muted = true;
            video.play();
        });
        
        console.log('✅ Cámara frontal iniciada');
        return true;
        
    } catch (error) {
        console.error('❌ Error con cámara frontal:', error);
        alert(`No se pudo acceder a la cámara frontal: ${error.message}\n\nUsa la opción de imagen de prueba.`);
        return false;
    }
}

// ============================================
// MODIFICAR FUNCIONES EXISTENTES
// ============================================

// Función para usar imagen de prueba (modificar para que detenga cámaras)
function useTestImage(stepNumber) {
    console.log(`Usando imagen de prueba para paso ${stepNumber}`);
    
    // Detener cualquier cámara activa
    stopAllStreams();
    
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    // Crear INE simulado
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 400, 250);
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(0, 0, 400, 60);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('INSTITUTO NACIONAL ELECTORAL', 20, 35);
    
    ctx.fillStyle = 'black';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('CREDENCIAL PARA VOTAR', 20, 90);
    
    ctx.font = '14px Arial';
    ctx.fillText('Nombre: JUAN PEREZ GARCIA', 20, 120);
    ctx.fillText('CURP: PEGF800101HDFRRR09', 20, 145);
    ctx.fillText('Dirección: CALLE FICTICIA 123', 20, 170);
    ctx.fillText('Clave de elector: ABCDEF123456', 20, 195);
    ctx.fillText('Fecha nacimiento: 01/01/1980', 20, 220);
    
    const testImage = canvas.toDataURL('image/jpeg', 0.8);
    
    // Guardar según el paso
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
    preview.innerHTML = `<img src="${testImage}" alt="Prueba ${stepNumber}" style="max-width: 200px;">`;
    
    // Avanzar al siguiente paso
    setTimeout(() => {
        showStep(stepNumber + 1);
    }, 500);
}

// Función para saltar pasos
function skipStep(stepNumber) {
    // Detener cámara si está activa
    stopStream(stepNumber);
    
    showStep(stepNumber + 1);
}

// ============================================
// REINICIAR DEMO MODIFICADO
// ============================================

// Reiniciar demo
function resetDemo() {
    console.log('=== REINICIANDO DEMO ===');
    
    // 1. Detener todas las cámaras
    stopAllStreams();
    
    // 2. Resetear fotos
    photos = {
        ine_front: null,
        ine_back: null,
        selfie: null
    };
    
    // 3. Limpiar previews
    for (let i = 1; i <= 3; i++) {
        const preview = document.getElementById(`preview${i}`);
        if (preview) preview.innerHTML = '';
    }
    
    // 4. Limpiar resultados
    const resultDiv = document.getElementById('result');
    if (resultDiv) resultDiv.innerHTML = '';
    
    // 5. Volver al paso 1
    showStep(1);
    
    console.log('Demo reiniciada');
}

// ============================================
// HACER FUNCIONES GLOBALES
// ============================================

window.forceCameraReset = forceCameraReset;
window.checkCameraStatus = checkCameraStatus;
window.startFrontCamera = startFrontCamera;
window.useTestImage = useTestImage;
window.skipStep = skipStep;
window.resetDemo = resetDemo;
window.testSimpleEndpoint = testSimpleEndpoint;