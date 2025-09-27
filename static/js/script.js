let texts = {};
let tg = window.Telegram.WebApp;

// Инициализация Telegram WebApp
function initTelegramWebApp() {
    if (tg) {
        console.log('Telegram WebApp инициализирован');
        tg.expand(); // Расширяем WebApp на весь экран
        tg.ready(); // Сообщаем что WebApp готов
        
        // Настраиваем главную кнопку
        tg.MainButton.text = "ОТПРАВИТЬ";
        tg.MainButton.color = "#007bff";
        
        // Показываем кнопку только когда форма заполнена
        tg.MainButton.hide();
        
        console.log('Telegram WebApp настроен');
        return true;
    } else {
        console.log('Telegram WebApp недоступен - работаем в обычном режиме');
        return false;
    }
}

// Проверка заполненности формы
function checkFormCompleteness() {
    const mainReason = document.getElementById('mainReason').value;
    const additionalDetails = document.getElementById('additionalDetails').value;
    const description = document.getElementById('description').value.trim();
    
    const isComplete = mainReason && additionalDetails && description;
    
    if (tg && tg.MainButton) {
        if (isComplete) {
            tg.MainButton.show();
        } else {
            tg.MainButton.hide();
        }
    }
    
    // Также обновляем состояние обычной кнопки
    const submitBtn = document.getElementById('submit');
    if (submitBtn) {
        submitBtn.disabled = !isComplete;
    }
    
    return isComplete;
}

// Функция для получения вложенного значения из объекта по строке типа "labels.main_reason"
function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Автосохранение данных формы (только в обычном режиме, не в Telegram)
function saveFormData() {
    // В Telegram WebApp не используем localStorage
    if (tg) {
        return;
    }
    
    const formData = {
        mainReason: document.getElementById('mainReason').value,
        additionalDetails: document.getElementById('additionalDetails').value,
        description: document.getElementById('description').value,
        timestamp: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('problemFormData', JSON.stringify(formData));
        console.log('Данные формы сохранены');
    } catch (error) {
        console.log('Не удалось сохранить данные:', error);
    }
}

// Восстановление данных формы (только в обычном режиме)
function restoreFormData() {
    // В Telegram WebApp не восстанавливаем данные
    if (tg) {
        return;
    }
    
    try {
        const savedData = localStorage.getItem('problemFormData');
        if (savedData) {
            const formData = JSON.parse(savedData);
            
            // Восстанавливаем основную причину
            const mainReasonSelect = document.getElementById('mainReason');
            if (formData.mainReason) {
                mainReasonSelect.value = formData.mainReason;
                
                // Триггерим событие change для загрузки деталей
                const changeEvent = new Event('change', { bubbles: true });
                mainReasonSelect.dispatchEvent(changeEvent);
                
                // Восстанавливаем детали после небольшой задержки
                setTimeout(() => {
                    const additionalDetailsSelect = document.getElementById('additionalDetails');
                    if (formData.additionalDetails) {
                        additionalDetailsSelect.value = formData.additionalDetails;
                    }
                    checkFormCompleteness(); // Проверяем заполненность после восстановления
                }, 100);
            }
            
            // Восстанавливаем описание
            if (formData.description) {
                document.getElementById('description').value = formData.description;
            }
            
            console.log('Данные формы восстановлены');
            showNotification('Данные формы восстановлены из предыдущего сеанса', 'info');
        }
    } catch (error) {
        console.log('Не удалось восстановить данные:', error);
    }
}

// Очистка сохраненных данных
function clearSavedData() {
    try {
        localStorage.removeItem('problemFormData');
        console.log('Сохраненные данные очищены');
    } catch (error) {
        console.log('Не удалось очистить данные:', error);
    }
}

// Показ уведомлений
function showNotification(message, type = 'success') {
    // Удаляем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'info':
            notification.style.backgroundColor = '#17a2b8';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ffc107';
            notification.style.color = '#212529';
            break;
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Добавляем анимацию
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Убираем уведомление через 4 секунды
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Отправка данных через Telegram WebApp
function sendDataToTelegram(formData) {
    if (tg) {
        try {
            console.log('Отправляем данные через Telegram WebApp:', formData);
            
            // Отправляем данные в бот
            tg.sendData(JSON.stringify(formData));
            
            // Показываем уведомление об успешной отправке
            showNotification('✅ Данные отправлены!', 'success');
            
            // Очищаем сохраненные данные
            clearSavedData();
            
            // Закрываем WebApp через небольшую задержку
            setTimeout(() => {
                tg.close();
            }, 1000);
            
            return true;
        } catch (error) {
            console.error('Ошибка отправки через Telegram WebApp:', error);
            showNotification('❌ Ошибка отправки данных', 'error');
            return false;
        }
    } else {
        console.log('Telegram WebApp недоступен');
        showNotification('⚠️ Telegram WebApp недоступен', 'warning');
        return false;
    }
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
        return [
            'static/texts.json',
            './static/texts.json'
        ];
    } else if (currentPath.endsWith('/') || currentPath.includes('github.io')) {
        return [
            'static/texts.json',
            './static/texts.json',
            `/static/texts.json`
        ];
    } else {
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
                return;
            }
        } catch (error) {
            console.log(`Не удалось загрузить из ${path}:`, error.message);
            continue;
        }
    }

    console.error('Не удалось загрузить тексты ни по одному пути');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        alert('Ошибка: Не удалось загрузить файл texts.json\nПроверьте консоль для подробностей');
    }
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, начинаем инициализацию...');
    console.log('Текущий URL:', window.location.href);
    
    // Инициализируем Telegram WebApp
    const isTelegramWebApp = initTelegramWebApp();
    
    loadTexts().then(() => {
        // Восстанавливаем данные формы после загрузки текстов (только не в Telegram)
        if (!isTelegramWebApp) {
            setTimeout(restoreFormData, 500);
        }
    });
    
    const mainReasonSelect = document.getElementById('mainReason');
    const additionalDetailsSelect = document.getElementById('additionalDetails');
    const form = document.getElementById('problemForm');
    const jsonOutput = document.getElementById('jsonOutput');
    const descriptionTextarea = document.getElementById('description');

    // Автосохранение при изменении полей (только не в Telegram)
    [mainReasonSelect, additionalDetailsSelect, descriptionTextarea].forEach(element => {
        element.addEventListener('input', () => {
            saveFormData();
            checkFormCompleteness();
        });
        element.addEventListener('change', () => {
            saveFormData();
            checkFormCompleteness();
        });
    });

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
        
        // Проверяем заполненность формы
        checkFormCompleteness();
    });

    // Обработка отправки формы
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });
    
    // Обработка нажатия главной кнопки Telegram
    if (tg && tg.MainButton) {
        tg.MainButton.onClick(function() {
            handleFormSubmit();
        });
    }
    
    function handleFormSubmit() {
        const jsonFields = texts.json_fields || {};
        
        const formData = {};
        formData[jsonFields.main_reason || "Основная причина проблемы"] = mainReasonSelect.options[mainReasonSelect.selectedIndex].text;
        formData[jsonFields.additional_explanation || "Дополнительное объяснение"] = additionalDetailsSelect.options[additionalDetailsSelect.selectedIndex].text;
        formData[jsonFields.text || "Текст"] = document.getElementById('description').value;
        
        // Добавляем timestamp
        formData.timestamp = new Date().toISOString();
        
        // Показываем JSON (только не в Telegram)
        if (!tg) {
            jsonOutput.textContent = JSON.stringify(formData, null, 2);
            jsonOutput.style.display = 'block';
        }
        
        console.log('Отправляемые данные:', formData);
        
        // Отправляем данные
        const success = sendDataToTelegram(formData);
        
        // Если отправка не удалась и мы не в Telegram, сохраняем данные
        if (!success && !tg) {
            showNotification('Данные сохранены локально', 'warning');
        }
    }
    
    // Начальная проверка заполненности формы
    checkFormCompleteness();
    
    // Проверяем есть ли сохраненные данные при загрузке (только не в Telegram)
    if (!isTelegramWebApp) {
        const savedData = localStorage.getItem('problemFormData');
        if (savedData) {
            console.log('Найдены сохраненные данные формы');
        }
    }
});
