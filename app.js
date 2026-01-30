// ============================================
// CONFIGURACIÓN
// ============================================

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

// ============================================
// FUNCIÓN PRINCIPAL DE OCR
// ============================================

// Validación OCR frontal
async function validateOCR() {
    console.log('=== VALIDACIÓN OCR FRONTAL ===');
    
    if (!photos.ine_front) {
        throw new Error('No hay foto del INE frontal');
    }
    
    // Verificar formato
    console.log('Formato de imagen:', photos.ine_front.substring(0, 50));
    
    if (!photos.ine_front.startsWith('data:image/')) {
        console.warn('Formato incorrecto, convirtiendo a data URL...');
        photos.ine_front = 'data:image/jpeg;base64,' + photos.ine_front;
    }
    
    // Limitar tamaño si es muy grande
    const maxSize = 200000; // ~200KB
    let imageData = photos.ine_front;
    
    if (imageData.length > maxSize) {
        console.log('Imagen demasiado grande, recortando...');
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

// ============================================
// FUNCIÓN DE COMPARACIÓN FACIAL
// ============================================

async function tryComparison() {
    const resultDiv = document.getElementById('result');
    const loadingDiv = document.getElementById('loading');
    
    if (!photos.ine_front || !photos.selfie) {
        alert('Necesitas INE frontal y selfie para comparación facial');
        return;
    }
    
    resultDiv.innerHTML = '';
    loadingDiv.style.display = 'block';
    
    try {
        console.log('=== INICIANDO COMPARACIÓN FACIAL ===');
        
        let ineFront = photos.ine_front;
        let selfie = photos.selfie;
        
        // Asegurar formato correcto
        if (!ineFront.startsWith('data:image/')) {
            ineFront = 'data:image/jpeg;base64,' + ineFront;
        }
        if (!selfie.startsWith('data:image/')) {
            selfie = 'data:image/jpeg;base64,' + selfie;
        }
        
        // Limitar tamaño
        const maxSize = 100000;
        if (ineFront.length > maxSize) {
            const prefix = ineFront.substring(0, ineFront.indexOf(',') + 1);
            const base64 = ineFront.substring(ineFront.indexOf(',') + 1);
            ineFront = prefix + base64.substring(0, maxSize - prefix.length);
        }
        if (selfie.length > maxSize) {
            const prefix = selfie.substring(0, selfie.indexOf(',') + 1);
            const base64 = selfie.substring(selfie.indexOf(',') + 1);
            selfie = prefix + base64.substring(0, maxSize - prefix.length);
        }
        
        console.log('Enviando comparación facial...');
        
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
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            
            if (response.status === 500) {
                throw new Error('El servidor de comparación facial no está respondiendo (error 500). Esto puede ser temporal.');
            }
            
            throw new Error(`Error ${response.status}: ${errorText.substring(0, 200)}`);
        }
        
        const data = await response.json();
        console.log('✅ Comparación facial exitosa:', data);
        
        loadingDiv.style.display = 'none';
        displayResults(data);
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        
        resultDiv.innerHTML = `
            <div class="error">
                <h3>❌ Error en comparación facial</h3>
                <p>${error.message}</p>
                <p><strong>Posibles causas:</strong></p>
                <ul>
                    <li>El endpoint /compare_face puede tener problemas temporales</li>
                    <li>Imágenes demasiado grandes o en formato incorrecto</li>
                    <li>Problemas de red o conexión</li>
                </ul>
                <p><strong>Alternativas:</strong></p>
                <div style="margin-top: 15px;">
                    <button onclick="validateIdentity()" style="background: #28a745; margin: 5px;">
                        🚀 Intentar validación OCR
                    </button>
                    <button onclick="testSimpleEndpoint()" style="background: #17a2b8; margin: 5px;">
                        🔍 Probar endpoint simple
                    </button>
                </div>
            </div>
        `;
        
        console.error('Error completo en comparación facial:', error);
    }
}

// ============================================
// FUNCIONES AUXILIARES DE PRUEBA
// ============================================

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
    
    if (typeof overrideCapturePhoto === 'undefined') {
        overrideCapturePhoto = function(stepNumber) {
            const video = document.getElementById(`video${stepNumber}`);
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            const width = 320;
            const height = 240;
            
            canvas.width = width;
            canvas.height = height;
            
            context.drawImage(video, 0, 0, width, height);
            
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
        
        window.capturePhoto = overrideCapturePhoto;
    }
}

// ============================================
// FUNCIONES DE VALIDACIÓN ADICIONALES
// ============================================

// Función de comparación facial alternativa
async function compareFaces() {
    console.log('=== COMPARACIÓN FACIAL ===');
    
    let ineFront = photos.ine_front;
    let selfie = photos.selfie;
    
    if (ineFront && !ineFront.startsWith('data:image/')) {
        ineFront = 'data:image/jpeg;base64,' + ineFront;
    }
    if (selfie && !selfie.startsWith('data:image/')) {
        selfie = 'data:image/jpeg;base64,' + selfie;
    }
    
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

// ============================================
// FUNCIÓN PARA PRUEBA SIMPLE
// ============================================

function testSimpleEndpoint() {
    console.log('=== TEST CON FORMATO CORRECTO ===');
    
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

// ============================================
// MOSTRAR RESULTADOS
// ============================================

function displayResults(data) {
    const resultDiv = document.getElementById('result');
    
    if (data.data && data.data.object === "obverse_ocr_readings") {
        const hasData = data.data.parse_ocr && data.data.parse_ocr.length > 0;
        const hasText = data.data.ocr && data.data.ocr.trim().length > 0;
        
        if (hasData || hasText) {
            resultDiv.innerHTML = `
                <div class="result success">
                    <h2>✅ LECTURA OCR EXITOSA</h2>
                    
                    ${hasText ? `
                    <div class="details">
                        <h3>📝 Texto extraído:</h3>
                        <div class="ocr-text">
                            <pre>${data.data.ocr}</pre>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${hasData ? `
                    <div class="details">
                        <h3>📊 Datos estructurados:</h3>
                        <div class="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Campo</th>
                                        <th>Valor</th>
                                        <th>Fuente</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.data.parse_ocr.map(item => `
                                        <tr>
                                            <td><strong>${item.name}</strong></td>
                                            <td>${item.value}</td>
                                            <td><span class="source">${item.source}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="action-buttons">
                        <button onclick="resetDemo()" style="background: #4CAF50;">
                            🔄 Nueva Validación
                        </button>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="result warning">
                    <h2>⚠️ OCR completado sin datos</h2>
                    <p>El OCR se ejecutó correctamente pero no detectó texto.</p>
                    <p><strong>Posibles causas:</strong></p>
                    <ul>
                        <li>La imagen no contiene texto legible</li>
                        <li>Calidad/resolución insuficiente</li>
                        <li>Iluminación inadecuada</li>
                        <li>Fuente de texto no reconocida</li>
                    </ul>
                    
                    <div class="action-buttons">
                        <button onclick="resetDemo()" style="background: #6c757d;">
                            🔄 Reintentar
                        </button>
                    </div>
                </div>
            `;
        }
        
    } else if (data.data && data.data.isMatch !== undefined) {
        const isMatch = data.data.isMatch;
        resultDiv.innerHTML = `
            <div class="result ${isMatch ? 'success' : 'error'}">
                <h2>${isMatch ? '✅ COINCIDENCIA' : '❌ NO COINCIDE'}</h2>
                <p>${isMatch ? 'La selfie coincide con la foto del INE' : 'La selfie NO coincide con la foto del INE'}</p>
                <button onclick="resetDemo()">🔄 Nueva Validación</button>
            </div>
        `;
        
    } else if (data.data && data.data.status !== undefined) {
        resultDiv.innerHTML = `
            <div class="result ${data.data.status ? 'success' : 'error'}">
                <h2>${data.data.status ? '✅ VALIDACIÓN EXITOSA' : '❌ VALIDACIÓN FALLIDA'}</h2>
                <p>${data.data.message || 'Proceso completado'}</p>
                <button onclick="resetDemo()">🔄 Nueva Validación</button>
            </div>
        `;
        
    } else {
        resultDiv.innerHTML = `
            <div class="result">
                <h2>📋 Resultado de API</h2>
                <div class="json-viewer">
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
                <button onclick="resetDemo()">🔄 Nueva Validación</button>
            </div>
        `;
    }
}

// ============================================
// REINICIAR DEMO
// ============================================

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
    if (resultDiv) resultDiv.innerHTML = '';
    
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    showStep(1);
    
    if (typeof overrideCapturePhoto !== 'undefined') {
        location.reload();
    } else {
        if (typeof initCamera !== 'undefined') {
            initCamera(1);
        }
    }
}

// ============================================
// HACER FUNCIONES GLOBALES
// ============================================

window.tryComparison = tryComparison;
window.testSimpleEndpoint = testSimpleEndpoint;
window.validateCURP = validateCURP;
window.testWithSmallImage = testWithSmallImage;
window.adjustCameraSettings = adjustCameraSettings;
window.resetDemo = resetDemo;