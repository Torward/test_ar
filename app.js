// Инициализация часов
document.addEventListener("DOMContentLoaded", function() {
    const clock = document.getElementById("clock");

    // Создаем циферблат (круг)
    const clockFace = document.createElement("a-circle");
    clockFace.setAttribute("radius", 0.5);
    clockFace.setAttribute("color", "#333");
    clockFace.setAttribute("position", "0 0 -0.1");
    clock.appendChild(clockFace);

    // Добавляем стрелки
    addHand(clock, "hour", 0.3, 0.05, "#FF0000");
    addHand(clock, "minute", 0.4, 0.03, "#00FF00");
    addHand(clock, "second", 0.45, 0.01, "#0000FF");

    // Обновляем время каждую секунду
    setInterval(updateClock, 1000);
});

// Создание стрелки
function addHand(parent, id, length, width, color) {
    const hand = document.createElement("a-box");
    hand.setAttribute("id", id);
    hand.setAttribute("height", length);
    hand.setAttribute("width", width);
    hand.setAttribute("depth", width);
    hand.setAttribute("color", color);
    hand.setAttribute("position", `0 ${length/2} 0`);
    parent.appendChild(hand);
}

// Обновление времени
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    const hourHand = document.getElementById("hour");
    const minuteHand = document.getElementById("minute");
    const secondHand = document.getElementById("second");

    hourHand.setAttribute("rotation", `0 0 ${(hours * 30) + (minutes * 0.5)}`);
    minuteHand.setAttribute("rotation", `0 0 ${minutes * 6}`);
    secondHand.setAttribute("rotation", `0 0 ${seconds * 6}`);
}

// Масштабирование
function scaleClock(factor) {
    const clock = document.getElementById("clock");
    const currentScale = clock.getAttribute("scale").x;
    clock.setAttribute("scale", {
        x: currentScale * factor,
        y: currentScale * factor,
        z: currentScale * factor
    });
}