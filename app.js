let scene, camera, renderer, clockModel;
let clockScale = 0.5;
let arSession = null;

// Инициализация сцены
function init() {
    // Создаем сцену
    scene = new THREE.Scene();
    
    // Камера
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);
    
    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('ar-container').appendChild(renderer.domElement);
    
    // Создаем часы
    createClock();
    
    // Обработчики событий
    window.addEventListener('resize', onWindowResize);
    document.getElementById('start-button').addEventListener('click', startAR);
    document.getElementById('scale-up').addEventListener('click', () => updateScale(1.2));
    document.getElementById('scale-down').addEventListener('click', () => updateScale(0.8));
    
    // Проверка поддержки WebXR
    if (!navigator.xr) {
        showError("WebXR не поддерживается в вашем браузере. Попробуйте Chrome или Safari на iOS 15+.");
    }
}

// Создание 3D-модели часов
function createClock() {
    const clockGroup = new THREE.Group();
    
    // Циферблат
    const faceGeometry = new THREE.CircleGeometry(0.5, 32);
    const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.rotation.x = -Math.PI / 2;
    clockGroup.add(face);
    
    // Стрелки
    const hourHand = createHand(0.3, 0.02, 0xff0000);
    const minuteHand = createHand(0.4, 0.015, 0x00ff00);
    const secondHand = createHand(0.45, 0.01, 0x0000ff);
    
    hourHand.name = 'hour';
    minuteHand.name = 'minute';
    secondHand.name = 'second';
    
    clockGroup.add(hourHand, minuteHand, secondHand);
    clockGroup.position.y = 0;
    clockGroup.scale.set(clockScale, clockScale, clockScale);
    
    scene.add(clockGroup);
    clockModel = clockGroup;
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
        renderer.xr.enabled = true;
        renderer.xr.setSession(session);
        
        // Обработка выбора поверхности
        session.addEventListener('select', onSelect);
        
        // Запускаем рендеринг
        renderer.setAnimationLoop(render);
        
    } catch (error) {
        showError(`Ошибка AR: ${error.message}`);
    }
}

// Рендеринг сцены
function render() {
    updateClock();
    renderer.render(scene, camera);
}

// Обработчик выбора поверхности
function onSelect() {
    if (!clockModel) return;
    
    // Размещаем часы перед пользователем
    clockModel.position.set(0, 0, -1);
    clockModel.rotation.set(0, 0, 0);
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