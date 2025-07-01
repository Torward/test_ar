import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';

let scene, camera, renderer, clockModel;
let clockScale = 0.5;
let arSession = null;
let hitTestSource = null;
let hitTestSourceRequested = false;


// Инициализация сцены
function init() {
    // Создаем сцену
    scene = new THREE.Scene();
    
    // Камера
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);
    
    // Рендерер с поддержкой WebXR
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    document.getElementById('ar-container').appendChild(renderer.domElement);
    
    // Создаем часы
    createClock();
    
    // Обработчики событий
    window.addEventListener('resize', onWindowResize);
    document.getElementById('start-button').addEventListener('click', startAR);
    document.getElementById('scale-up').addEventListener('click', () => updateScale(1.2));
    document.getElementById('scale-down').addEventListener('click', () => updateScale(0.8));
    
    // Проверка поддержки WebXR
    checkWebXRSupport();
    
    // Запускаем обычный рендеринг (не AR)
    renderer.setAnimationLoop(render);
}

// Проверка поддержки WebXR
async function checkWebXRSupport() {
    if (!navigator.xr) {
        showError("WebXR не поддерживается в вашем браузере. Попробуйте Chrome на Android или Safari на iOS 15+.");
        return;
    }
    
    try {
        const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!isSupported) {
            showError("AR режим не поддерживается на этом устройстве.");
        }
    } catch (error) {
        showError("Ошибка проверки поддержки AR: " + error.message);
    }
}

// Создание 3D-модели часов
function createClock() {
    const clockGroup = new THREE.Group();
    
    // Циферблат
    const faceGeometry = new THREE.CircleGeometry(0.5, 32);
    const faceMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.rotation.x = -Math.PI / 2;
    clockGroup.add(face);
    
    // Рамка циферблата
    const rimGeometry = new THREE.RingGeometry(0.48, 0.52, 32);
    const rimMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.001;
    clockGroup.add(rim);
    
    // Добавляем цифры на циферблат
    createClockNumbers(clockGroup);
    
    // Центральная точка
    const centerGeometry = new THREE.CircleGeometry(0.03, 16);
    const centerMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.rotation.x = -Math.PI / 2;
    center.position.y = 0.002;
    clockGroup.add(center);
    
    // Стрелки
    const hourHand = createHand(0.25, 0.025, 0x333333);
    const minuteHand = createHand(0.35, 0.02, 0x333333);
    const secondHand = createHand(0.4, 0.01, 0xff0000);
    
    hourHand.name = 'hour';
    minuteHand.name = 'minute';
    secondHand.name = 'second';
    
    clockGroup.add(hourHand, minuteHand, secondHand);
    clockGroup.position.y = 0;
    clockGroup.scale.set(clockScale, clockScale, clockScale);
    
    scene.add(clockGroup);
    clockModel = clockGroup;
}

// Создание цифр на циферблате
async function createClockNumbers(clockGroup) {

    // Создаем простые метки вместо текста для лучшей совместимости
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const radius = 0.38;

        // Создаем метку для каждого часа
        const markGeometry = new THREE.BoxGeometry(0.02, 0.06, 0.01);
        const markMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
        const mark = new THREE.Mesh(markGeometry, markMaterial);

        mark.position.x = Math.cos(angle) * radius;
        mark.position.z = Math.sin(angle) * radius;
        mark.position.y = 0.001;
        mark.rotation.x = -Math.PI / 2;
        mark.rotation.z = angle + Math.PI / 2;

        clockGroup.add(mark);

        // Добавляем минутные метки
        if (i % 3 !== 0) { // Не добавляем на 12, 3, 6, 9
            for (let j = 1; j <= 4; j++) {
                const minuteAngle = ((i - 1) * 30 + j * 6 - 90) * Math.PI / 180;
                const minuteMarkGeometry = new THREE.BoxGeometry(0.01, 0.03, 0.005);
                const minuteMark = new THREE.Mesh(minuteMarkGeometry, markMaterial);

                minuteMark.position.x = Math.cos(minuteAngle) * (radius + 0.05);
                minuteMark.position.z = Math.sin(minuteAngle) * (radius + 0.05);
                minuteMark.position.y = 0.001;
                minuteMark.rotation.x = -Math.PI / 2;
                minuteMark.rotation.z = minuteAngle + Math.PI / 2;

                clockGroup.add(minuteMark);
            }
        }
    }
}

// Создание стрелки
function createHand(length, width, color) {
    const geometry = new THREE.BoxGeometry(width, length, width);
    const material = new THREE.MeshBasicMaterial({ color });
    const hand = new THREE.Mesh(geometry, material);
    hand.position.y = length / 2;
    return hand;
}

// Обновление времени
function updateClock() {
    if (!clockModel) return;
    
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    const hourHand = clockModel.getObjectByName('hour');
    const minuteHand = clockModel.getObjectByName('minute');
    const secondHand = clockModel.getObjectByName('second');
    
    hourHand.rotation.z = -((hours * 30 + minutes * 0.5) * Math.PI / 180);
    minuteHand.rotation.z = -(minutes * 6 * Math.PI / 180);
    secondHand.rotation.z = -(seconds * 6 * Math.PI / 180);
}

// Запуск AR
async function startAR() {
    try {
        // Проверяем поддержку WebXR
        if (!navigator.xr) {
            throw new Error("WebXR не поддерживается");
        }
        
        // Запрашиваем сессию AR
        const session = await navigator.xr.requestSession("immersive-ar", {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });
        
        arSession = session;
        document.getElementById('start-button').style.display = 'none';
        
        // Настройка сессии
        await renderer.xr.setSession(session);
        
        // Обработка событий сессии
        session.addEventListener('select', onSelect);
        session.addEventListener('end', onSessionEnd);
        
        // Скрываем часы до размещения
        if (clockModel) {
            clockModel.visible = false;
        }
        
    } catch (error) {
        showError(`Ошибка AR: ${error.message}`);
        document.getElementById('start-button').style.display = 'block';
    }
}

// Рендеринг сцены
function render(timestamp, frame) {
    updateClock();
    
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();
        
        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
                session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                    hitTestSource = source;
                });
            });
            hitTestSourceRequested = true;
        }
        
        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                // Можно использовать hit для позиционирования объектов
            }
        }
    }
    
    renderer.render(scene, camera);
}

// Обработчик выбора поверхности
function onSelect(event) {
    if (!clockModel) return;
    
    const frame = event.frame;
    const session = renderer.xr.getSession();
    
    if (hitTestSource && frame) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(renderer.xr.getReferenceSpace());
            
            if (pose) {
                // Размещаем часы в точке касания
                clockModel.position.setFromMatrixPosition(new THREE.Matrix4().fromArray(pose.transform.matrix));
                clockModel.visible = true;
            }
        }
    } else {
        // Fallback: размещаем часы перед пользователем
        clockModel.position.set(0, 0, -1);
        clockModel.visible = true;
    }
}

// Обработчик завершения AR сессии
function onSessionEnd() {
    arSession = null;
    hitTestSource = null;
    hitTestSourceRequested = false;
    document.getElementById('start-button').style.display = 'block';
    
    if (clockModel) {
        clockModel.visible = true;
        clockModel.position.set(0, 0, -1);
    }
}

// Обновление масштаба
function updateScale(factor) {
    if (!clockModel) return;
    clockScale *= factor;
    clockModel.scale.set(clockScale, clockScale, clockScale);
}

// Обработчик изменения размера окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Показать ошибку
function showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

// Запуск приложения
init();
