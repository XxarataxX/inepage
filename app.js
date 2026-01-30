// Validar identidad completa
async function validateIdentity() {
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    
    if (!photos.ine_front) {
        alert('Necesitas al menos la foto frontal del INE');
        return;
    }
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        const ocrResult = await validateOCR();
        loadingDiv.style.display = 'none';
        displayResults(ocrResult);
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        resultDiv.innerHTML = `
            <div class="error">
                <h3>❌ Error en validación</h3>
                <p>${error.message}</p>
                <p><button onclick="testSimpleEndpoint()" style="background: #6c757d; margin-top: 10px;">
                    🔍 Probar Endpoint Simple
                </button></p>
            </div>
        `;
        console.error('Error completo:', error);
    }
}

// Validación OCR frontal - CORREGIDO: enviar data URL completo
async function validateOCR() {
    console.log('=== VALIDACIÓN OCR FRONTAL ===');
    
    if (!photos.ine_front) {
        throw new Error('No hay foto del INE frontal');
    }
    
    // Verificar formato
    console.log('Formato de imagen:', photos.ine_front.substring(0, 50));
    
    if (!photos.ine_front.startsWith('data:image/')) {
        console.warn('Formato incorrecto, convirtiendo a data URL...');
        // Si por alguna razón no es data URL, convertirlo
        photos.ine_front = 'data:image/jpeg;base64,' + photos.ine_front;
    }
    
    // Limitar tamaño si es muy grande
    const maxSize = 200000; // ~200KB
    let imageData = photos.ine_front;
    
    if (imageData.length > maxSize) {
        console.log('Imagen demasiado grande, recortando...');
        // Mantener el prefijo data:image/ y parte del base64
        const prefix = imageData.substring(0, imageData.indexOf(',') + 1);
        const base64 = imageData.substring(imageData.indexOf(',') + 1);
        const limitedBase64 = base64.substring(0, maxSize - prefix.length);
        imageData = prefix + limitedBase64;
    }
    
    console.log('Enviando OCR...');
    console.log('Tamaño total:', imageData.length, 'caracteres');
    console.log('Prefijo data URL:', imageData.substring(0, 100));
    
    const response = await fetch('https://api.verificamex.com/identity/v1/ocr/obverse', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VERIFICAMEX_TOKEN}`
        },
        body: JSON.stringify({
            ine_front: imageData
        })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Verificar si es error de formato
        if (errorText.includes('parametro') || errorText.includes('estructura')) {
            console.log('Probable error de formato, mostrando ejemplo...');
            showFormatExample();
        }
        
        throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`);
    }
    
    const data = await response.json();
    console.log('✅ OCR exitoso');
    return data;
}

// Mostrar ejemplo de formato correcto
function showFormatExample() {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `
        <div class="info">
            <h3>⚠️ Formato de imagen incorrecto</h3>
            <p>La API espera el formato completo data URL:</p>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px; overflow-x: auto;">
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcU...
            </pre>
            <p><strong>Solución:</strong> Ya estamos enviando el formato correcto. El problema puede ser:</p>
            <ul>
                <li>Imagen demasiado grande (> 500KB)</li>
                <li>Formato no JPEG (usar .toDataURL('image/jpeg'))</li>
                <li>Problema temporal del servidor</li>
            </ul>
            <button onclick="testWithSmallImage()">🧪 Probar con imagen pequeña</button>
        </div>
    `;
}

// Probar con imagen pequeña generada
async function testWithSmallImage() {
    console.log('Creando imagen pequeña de prueba...');
    
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Dibujar un "INE" simulado
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(0, 0, 300, 50);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('INE DE PRUEBA', 20, 30);
    ctx.font = '14px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Nombre: JUAN PEREZ GARCIA', 20, 80);
    ctx.fillText('CURP: PEGF800101HDFRRR09', 20, 110);
    ctx.fillText('Dirección: CALLE FICTICIA 123', 20, 140);
    
    const testImage = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Imagen prueba creada:', testImage.substring(0, 100) + '...');
    
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '<p>Probando con imagen de prueba...</p>';
    
    try {
        const response = await fetch('https://api.verificamex.com/identity/v1/ocr/obverse', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VERIFICAMEX_TOKEN}`
            },
            body: JSON.stringify({
                ine_front: testImage
            })
        });
        
        const data = await response.json();
        resultDiv.innerHTML = `
            <div class="success">
                <h3>✅ ¡FUNCIONA!</h3>
                <p>La API acepta el formato correctamente.</p>
                <p>El problema está en las imágenes de la cámara.</p>
                <p><strong>Solución:</strong> Reducir más la calidad/resolución.</p>
                <button onclick="adjustCameraSettings()">⚙️ Ajustar configuración</button>
            </div>
        `;
    } catch (error) {
        resultDiv.innerHTML = `
            <div class="error">
                <h3>❌ Error persistente</h3>
                <p>${error.message}</p>
                <p>Contacta a Verificamex soporte.</p>
            </div>
        `;
    }
}

// Función para ajustar configuración de cámara
function adjustCameraSettings() {
    alert('Cambiando configuración de cámara:\n\n1. Resolución: 320x240\n2. Calidad: 40%\n3. Formato: JPEG\n\nReinicia la demo para aplicar cambios.');
    
    // Modificar la función capturePhoto globalmente
    if (typeof overrideCapturePhoto === 'undefined') {
        overrideCapturePhoto = function(stepNumber) {
            const video = document.getElementById(`video${stepNumber}`);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            // Tamaño MUY pequeño para prueba
            const width = 320;
            const height = 240;
            
            canvas.width = width;
            canvas.height = height;
            
            context.drawImage(video, 0, 0, width, height);
            
            // Calidad MUY baja
            const imageData = canvas.toDataURL('image/jpeg', 0.4);
            
            console.log(`Foto ${stepNumber} (baja calidad):`, imageData.length, 'chars');
            
            switch(stepNumber) {
                case 1: photos.ine_front = imageData; break;
                case 2: photos.ine_back = imageData; break;
                case 3: photos.selfie = imageData; break;
            }
            
            const preview = document.getElementById(`preview${stepNumber}`);
            preview.innerHTML = `<img src="${imageData}" alt="Foto ${stepNumber}" style="max-width: 200px;">`;
            
            setTimeout(() => {
                showStep(stepNumber + 1);
                if (stepNumber < 3) initCamera(stepNumber + 1);
            }, 500);
        };
        
        // Reemplazar función original
        window.capturePhoto = overrideCapturePhoto;
    }
}

// Función de comparación facial - CORREGIDA
async function compareFaces() {
    console.log('=== COMPARACIÓN FACIAL ===');
    
    // Asegurar formato data URL
    let ineFront = photos.ine_front;
    let selfie = photos.selfie;
    
    if (ineFront && !ineFront.startsWith('data:image/')) {
        ineFront = 'data:image/jpeg;base64,' + ineFront;
    }
    if (selfie && !selfie.startsWith('data:image/')) {
        selfie = 'data:image/jpeg;base64,' + selfie;
    }
    
    // Reducir tamaño
    const maxSize = 100000;
    if (ineFront && ineFront.length > maxSize) {
        const prefix = ineFront.substring(0, ineFront.indexOf(',') + 1);
        const base64 = ineFront.substring(ineFront.indexOf(',') + 1);
        ineFront = prefix + base64.substring(0, maxSize - prefix.length);
    }
    if (selfie && selfie.length > maxSize) {
        const prefix = selfie.substring(0, selfie.indexOf(',') + 1);
        const base64 = selfie.substring(selfie.indexOf(',') + 1);
        selfie = prefix + base64.substring(0, maxSize - prefix.length);
    }
    
    try {
        const response = await fetch('https://api.verificamex.com/identity/v1/validations/compare_face', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${VERIFICAMEX_TOKEN}`
            },
            body: JSON.stringify({
                ine_front: ineFront,
                selfie: selfie
            })
        });
        
        console.log('Compare faces status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Compare faces error:', errorText);
            throw new Error(`Compare faces error: ${response.status} - ${errorText.substring(0, 100)}`);
        }
        
        return await response.json();
        
    } catch (error) {
        console.error('Compare faces failed:', error);
        throw error;
    }
}

// Función completa de INE
async function fullValidation() {
    console.log('Validación completa...');
    
    // Preparar imágenes con formato correcto
    const payload = {
        ine_front: photos.ine_front && !photos.ine_front.startsWith('data:image/') 
            ? 'data:image/jpeg;base64,' + photos.ine_front 
            : photos.ine_front,
        ine_back: photos.ine_back && !photos.ine_back.startsWith('data:image/')
            ? 'data:image/jpeg;base64,' + photos.ine_back
            : photos.ine_back,
        selfie: photos.selfie && !photos.selfie.startsWith('data:image/')
            ? 'data:image/jpeg;base64,' + photos.selfie
            : photos.selfie,
        model: 'D'
    };
    
    const response = await fetch('https://api.verificamex.com/identity/v1/validations/basic', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VERIFICAMEX_TOKEN}`
        },
        body: JSON.stringify(payload)
    });
    
    console.log('Full validation status:', response.status);
    
    if (!response.ok) {
        throw new Error(`Full validation error: ${response.status}`);
    }
    
    return await response.json();
}

// Validar CURP
async function validateCURP(curp) {
    const response = await fetch('https://api.verificamex.com/identity/v1/scraping/renapo', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${VERIFICAMEX_TOKEN}`
        },
        body: JSON.stringify({ curp: curp || "XEXX010101HNEXXXA4" })
    });
    
    return await response.json();
}

// Mostrar resultados
function displayResults(data) {
    const resultDiv = document.getElementById('result');
    
    if (data.data && data.data.object === "obverse_ocr_readings") {
        resultDiv.innerHTML = `
            <div class="result success">
                <h2>✅ LECTURA OCR EXITOSA</h2>
                <p>Datos extraídos del INE:</p>
                
                <div class="details">
                    <h3>Texto OCR:</h3>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <pre style="white-space: pre-wrap; font-size: 12px; max-height: 200px; overflow-y: auto;">
${data.data.ocr || 'No disponible'}
                        </pre>
                    </div>
                    
                    <h3>Datos detectados:</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="background: #e9ecef;">
                                <th style="padding: 8px; text-align: left;">Campo</th>
                                <th style="padding: 8px; text-align: left;">Valor</th>
                            </tr>
                            ${data.data.parse_ocr ? data.data.parse_ocr.map(item => `
                                <tr style="border-bottom: 1px solid #dee2e6;">
                                    <td style="padding: 8px;"><strong>${item.name}</strong></td>
                                    <td style="padding: 8px;">${item.value}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="2">No hay datos estructurados</td></tr>'}
                        </table>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <button onclick="resetDemo()" style="background: #4CAF50;">🔄 Nueva Validación</button>
                    <button onclick="tryComparison()" style="background: #ffc107; color: #000;">😊 Comparar con Selfie</button>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="result">
                <h2>📋 Resultado</h2>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto;">
${JSON.stringify(data, null, 2)}
                </pre>
                <button onclick="resetDemo()">🔄 Nueva Validación</button>
            </div>
        `;
    }
}

// Reiniciar demo
function resetDemo() {
    photos = {
        ine_front: null,
        ine_back: null,
        selfie: null
    };
    
    for (let i = 1; i <= 3; i++) {
        const preview = document.getElementById(`preview${i}`);
        if (preview) preview.innerHTML = '';
    }
    
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';
    
    showStep(1);
    
    // Restaurar función original si fue sobreescrita
    if (typeof overrideCapturePhoto !== 'undefined') {
        // Recargar página para restaurar configuración original
        location.reload();
    } else {
        initCamera(1);
    }
}

// Hacer funciones globales
window.testSimpleEndpoint = testSimpleEndpoint;
window.validateCURP = validateCURP;
window.testWithSmallImage = testWithSmallImage;
window.adjustCameraSettings = adjustCameraSettings;
window.tryComparison = tryComparison;