let texts = {};

// Функция для получения вложенного значения из объекта по строке типа "labels.main_reason"
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Функция для применения текстов к элементам
function applyTexts() {
    console.log('Применяем тексты...');
    
    // Применяем тексты к элементам с атрибутом data-text
    document.querySelectorAll('[data-text]').forEach(element => {
        const textKey = element.getAttribute('data-text');
        const text = getNestedValue(texts, textKey);
        if (text) {
            if (element.tagName === 'TITLE') {
                element.textContent = text;
            } else {
                element.textContent = text;
            }
        }
    });

    // Применяем плейсхолдеры
    document.querySelectorAll('[data-placeholder]').forEach(element => {
        const placeholderKey = element.getAttribute('data-placeholder');
        const placeholder = getNestedValue(texts, placeholderKey);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });
}

// Функция для заполнения основных причин
function populateMainReasons() {
    const mainReasonSelect = document.getElementById('mainReason');
    const defaultOption = mainReasonSelect.querySelector('option[value=""]');
    
    // Очищаем все опции кроме первой
    mainReasonSelect.innerHTML = '';
    if (defaultOption) {
        mainReasonSelect.appendChild(defaultOption);
    }
    
    // Добавляем основные причины
    Object.entries(texts.main_reasons || {}).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value;
        mainReasonSelect.appendChild(option);
    });
}

// Функция для заполнения деталей
function populateDetails() {
    const additionalDetailsSelect = document.getElementById('additionalDetails');
    const defaultOption = additionalDetailsSelect.querySelector('option[value=""]');
    
    // Очищаем все опции кроме первой
    additionalDetailsSelect.innerHTML = '';
    if (defaultOption) {
        additionalDetailsSelect.appendChild(defaultOption);
    }
    
    // Добавляем все детали с атрибутами категорий
    Object.entries(texts.details || {}).forEach(([category, details]) => {
        Object.entries(details).forEach(([key, value]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = value;
            option.setAttribute('data-category', category);
            option.style.display = 'none';
            additionalDetailsSelect.appendChild(option);
        });
    });
}

// Функция для определения правильного пути к JSON
function getJsonPaths() {
    const currentPath = window.location.pathname;
    console.log('Текущий путь:', currentPath);
    
    // Определяем базовый путь в зависимости от структуры
    if (currentPath.includes('/docs/')) {
        // Если используется папка docs
        return [
            'static/texts.json',
            './static/texts.json'
        ];
    } else if (currentPath.endsWith('/') || currentPath.includes('github.io')) {
        // GitHub Pages с файлом в корне или index.html
        return [
            'static/texts.json',
            './static/texts.json',
            `/static/texts.json`
        ];
    } else {
        // Локальная разработка или другие случаи
        return [
            'static/texts.json',
            './static/texts.json',
            '../static/texts.json',
            '/static/texts.json'
        ];
    }
}

// Загружаем тексты из JSON файла
async function loadTexts() {
    const possiblePaths = getJsonPaths();
    
    for (const path of possiblePaths) {
        try {
            console.log(`Пробуем загрузить: ${path}`);
            const response = await fetch(path);
            console.log(`Response status for ${path}:`, response.status);
            
            if (response.ok) {
                texts = await response.json();
                console.log('Загруженные тексты:', texts);
                
                // Применяем тексты после загрузки
                applyTexts();
                populateMainReasons();
                populateDetails();
                
                console.log('Тексты применены успешно из:', path);
                return; // Успешно загружено, выходим из функции
            }
        } catch (error) {
            console.log(`Не удалось загрузить из ${path}:`, error.message);
            continue; // Пробуем следующий путь
        }
    }

    // Если ни один путь не сработал
    console.error('Не удалось загрузить тексты ни по одному пути');
    console.log('Возможные причины:');
    console.log('1. Файл texts.json не существует в папке static/');
    console.log('2. GitHub Pages еще не обновился (может занять несколько минут)');
    console.log('3. Неправильная структура репозитория');
    
    // Показываем alert только в режиме разработки (localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        alert('Ошибка: Не удалось загрузить файл texts.json\nПроверьте консоль для подробностей');
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем загрузку текстов...');
    console.log('Текущий URL:', window.location.href);
    
    loadTexts();
    
    const mainReasonSelect = document.getElementById('mainReason');
    const additionalDetailsSelect = document.getElementById('additionalDetails');
    const form = document.getElementById('problemForm');
    const jsonOutput = document.getElementById('jsonOutput');

    mainReasonSelect.addEventListener('change', function() {
        const selectedReason = this.value;
        
        // Скрываем все опции
        const allOptions = additionalDetailsSelect.querySelectorAll('option[data-category]');
        allOptions.forEach(option => {
            option.style.display = 'none';
            option.selected = false;
        });
        
        if (selectedReason) {
            additionalDetailsSelect.disabled = false;
            
            // Показываем опции для выбранной категории
            const categoryOptions = additionalDetailsSelect.querySelectorAll(`option[data-category="${selectedReason}"]`);
            categoryOptions.forEach(option => {
                option.style.display = 'block';
            });
            
            // Меняем текст первой опции
            const selectDetailsText = getNestedValue(texts, 'placeholders.select_details') || 'Выберите детали';
            additionalDetailsSelect.options[0].textContent = selectDetailsText;
            additionalDetailsSelect.value = '';
        } else {
            additionalDetailsSelect.disabled = true;
            const firstSelectText = getNestedValue(texts, 'placeholders.first_select_reason') || 'Сначала выберите основную причину';
            additionalDetailsSelect.options[0].textContent = firstSelectText;
            additionalDetailsSelect.value = '';
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const jsonFields = texts.json_fields || {};
        
        const formData = {};
        formData[jsonFields.main_reason || "Основная причина проблемы"] = mainReasonSelect.options[mainReasonSelect.selectedIndex].text;
        formData[jsonFields.additional_explanation || "Дополнительное объяснение"] = additionalDetailsSelect.options[additionalDetailsSelect.selectedIndex].text;
        formData[jsonFields.text || "Текст"] = document.getElementById('description').value;
        
        jsonOutput.textContent = JSON.stringify(formData, null, 2);
        jsonOutput.style.display = 'block';
        
        console.log('Отправляемые данные:', formData);
    });
});