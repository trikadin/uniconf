# Uniconf

Простой [config](https://www.npmjs.com/package/config)-like конфигуратор с поддержкой параметров командной строки, переменных среды и вычисляемых опций, преобразования значений и их валидации.

## Установка

### npm

```bash
npm install uniconf --save
```

### yarn

```bash
yarn add uniconf
```

## Базовое использование

- Создайте папку config в корне своего проекта
- Внутри этой папки создайте default.js, development.js и production.js
- Каждый из этих файлов должен экспортировать объект – uniconf берет за основу `default.js`, и подмешивает к нему `development.js` или `production.js` -- в зависимости от NODE_ENV.
 
## Расширенные опции

uniconf предоставляет простой интерфейс для использования переменных среды, параметров командной строки и создания вычисляемых в рантайме свойств, а также их преобразования и валидации.

### option
Большинство расширенных возможностей предоставляет функция `option` из `uniconf/options`.

Пример:

`default.js`
```js
const {option: o} = require('uniconf/options');

module.exports = {
  port: o('port', {
    default: 8080,
    
    short: 'p', // короткий алиас '-p' для командной строки
    
    env: true, // теперь значение этой опции можно менять через переменную среды PORT
    
    coerce(value) {
      return Number(value); // приводим к числу
    },
    
    validate(value) {
      return value > 0 && value < 65536; // валидируем значение
    }
  })
}
```

`app.js`
```js
const config = require('uniconf');

console.log(`Application listen port ${config.port}`);
```

Теперь приложение можно запускать на разных портах:

```bash
$ node app --port 1717
Application listen port 1717

$ node app -p 2020
Application listen port 2020

$ export PORT=3030
$ node app
Application listen port 3030
```
