# Пример использования Claude Copilot Action

Этот файл показывает, как настроить Claude Copilot в вашем репозитории.

## Быстрый старт

1. Создайте файл `.github/workflows/claude-agent.yml` в вашем репозитории
2. Скопируйте содержимое из этого репозитория
3. Добавьте секрет `ANTHROPIC_API_KEY` в настройках репозитория
4. Настройте webhook для обработки лейблов

## Кастомизация

### Изменение лейбла-триггера

В webhook измените:
```typescript
if (body.action !== 'labeled' || label.name !== 'your-custom-label') {
```

### Изменение префикса веток

В webhook функция `generateBranchName`:
```typescript
const basePrefix = `ai/issue-${issueNumber}-`; // вместо claude/
```

### Настройка инструментов Claude

В workflow файле секция `allowed_tools`:
```yaml
allowed_tools: |
  # Базовые инструменты
  Bash(git:*),
  View,
  Edit,
  
  # Дополнительные инструменты
  Bash(npm:*),  # Для работы с npm
  Bash(python:*),  # Для Python скриптов
```

## Примеры задач для Claude

### Простая задача
```
Title: Добавить валидацию email
Description: Нужно добавить проверку формата email в функцию registerUser
```

### Задача с тестами
```
Title: Реализовать функцию поиска
Description: 
- Добавить функцию поиска по массиву объектов
- Поиск должен быть регистронезависимым
- Написать unit тесты
```

### Рефакторинг
```
Title: Рефакторинг модуля авторизации
Description:
- Разделить большую функцию на несколько маленьких
- Добавить JSDoc комментарии
- Улучшить обработку ошибок
```
