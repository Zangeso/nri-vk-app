Модульный редизайн для VK Mini App

Что внутри:
- app.tokens.css — цветовые переменные и темы
- app.base.css — reset, базовый фон, typography
- app.layout.css — контейнеры, сетки, panels
- app.components.css — кнопки, поля, карточки, модалки, chips, toast
- app.cabinet.css — кабинет игрока, лента, персонажи, модалки персонажа
- app.admin.css — админка, миры/кампании, публикация сессии
- app.vk.css — safe-area, mobile tuning, VK viewport tweaks
- vk-theme-runtime.js — тёмная/светлая тема, sync с VK config и ручной toggle
- index.modular.html — обновлённая страница кабинета
- admin.modular.html — обновлённая страница админки

Как поставить:
1. Сделай backup текущих index.html, admin.html и старых css.
2. Положи все файлы из этой папки рядом с index.html/admin.html.
3. Замени index.html содержимым из index.modular.html.
4. Замени admin.html содержимым из admin.modular.html.
5. Убедись, что пути до js/main.js и js/admin.js в твоём проекте корректны.
6. Старый style.css не подключай.

Что учтено для VK:
- viewport-fit=cover
- safe-area через env(safe-area-inset-*)
- высота через 100svh и --vk-viewport-height
- синхронизация темы через VKWebAppGetConfig / VKWebAppUpdateConfig
- плотная мобильная вёрстка без горизонтального скролла на основных экранах

Если нужен следующий этап:
- могу сделать отдельный визуальный проход по кабинету
- могу сделать отдельный проход по админке
- могу собрать супер-аккуратную типографику и пустые состояния
