const canvas = document.getElementById('canvas_2d')
const ctx = canvas.getContext('2d')
const ellipse = document.getElementById('figure_ellipse')
const rect = document.getElementById('figure_rect')
const button_import = document.getElementById('import')
const button_export = document.getElementById('export')
const button_clear = document.getElementById('clear')
const input_import = document.getElementById('input')
//массив с элементами.
let items = JSON.parse(localStorage.getItem('items')) || []

//функция для отслеживания нажатия на документ
document.onmousedown = function (e) {
    //нахождение элемента под координатами клика
    let element = document.elementFromPoint(e.clientX, e.clientY)
    //в зависимости от элемента выполняем определенную функцию
    switch (element) {
        case ellipse:
            figuresMove(e, ellipse)
            break
        case rect:
            figuresMove(e, rect)
            break
        case canvas:
            canvasMove(e)
            break
    }
}

//функция для добавления новой фигуры на холст
function figuresMove(e, elem) {
    const elem_gbcr = elem.getBoundingClientRect()
    const x = e.clientX - elem_gbcr.left
    const y = e.clientY - elem_gbcr.top

    document.addEventListener('mousemove', mousemove)
    elem.addEventListener('mouseup', mouseup)

    //перемещение фигуры
    function mousemove(e) {
        elem.style.left = e.pageX - x + 'px'
        elem.style.top = e.pageY - y + 'px'
    }

    //при отжатии клавиши мыши добавляем элемент в массив элементов учитывая коллизию
    //и сохраняем массив элементов в localstorage
    function mouseup(e) {
        mouseup_add(e, elem.id, x, y, 0)
        //возвращаем фигуру на исходное место и удаляем ненужные обработчики
        elem.style.top = 'unset'
        elem.style.left = 'unset'
        document.removeEventListener('mousemove', mousemove)
        elem.removeEventListener('mouseup', mouseup)
    }
    //отключаем "родной" drag and drop
    elem.ondragstart = function () {
        return false
    }
}

//вынесенная функция для добавления элемента на канвас, т.к. используется в двух местах
//переменная status показывает откуда был сдела вызов, и в зависимости от этого по разному вычисляются координаты
function mouseup_add(e, type, x, y, status) {
    const canvas_gbcr = canvas.getBoundingClientRect()
    if (e.clientY >= canvas_gbcr.top && e.clientY <= canvas_gbcr.top + canvas.height &&
        e.clientX >= canvas_gbcr.left && e.clientX <= canvas_gbcr.left + canvas.width) {

        let item_x
        let item_y

        if (status === 0) {
            item_x = e.clientX - canvas_gbcr.left - (x - 50)
            item_y = e.clientY - canvas_gbcr.top - (y - 30)
        }

        if (status === 1) {
            item_x = e.clientX - canvas_gbcr.left + x
            item_y = e.clientY - canvas_gbcr.top + y
        }

        if (item_x <= 50) item_x = 50
        if (item_x >= canvas.width - 50) item_x = canvas.width - 50
        if (item_y <= 30) item_y = 30
        if (item_y >= canvas.height - 30) item_y = canvas.height - 30

        items = items.map((i) => {
            i.active = false
            return i
        })

        items.push({
            active: true,
            type: type.replace('figure_', ''),
            x: item_x,
            y: item_y
        })
        save()
    }
}

//функция для перемещения (учитывая коллизию), и удаления элементов на канвасе 
function canvasMove(e) {
    const canvas_gbcr = canvas.getBoundingClientRect()
    let current
    let type
    let x
    let y
    if (e.clientY >= canvas_gbcr.top && e.clientY <= canvas_gbcr.top + canvas.height &&
        e.clientX >= canvas_gbcr.left && e.clientX <= canvas_gbcr.left + canvas.width) {
        const item_x = e.clientX - canvas_gbcr.left
        const item_y = e.clientY - canvas_gbcr.top

        //проверяем массив элементов и возвращаем все которые находятся под курсором мыши
        //т.к. мы не выходим из цикла при первом найденном элементе то выбранным будет последний элемент
        //сохраняем его координаты и индекс
        items.forEach((element, index) => {
            if (element.x > item_x - 50 && element.x < item_x + 50 &&
                element.y > item_y - 30 && element.y < item_y + 30) {
                x = element.x - item_x
                y = element.y - item_y
                current = index
                type = element.type
                if (e.button === 0) {
                    items = items.map((i) => {
                        i.active = false
                        return i
                    })
                    element.active = !element.active
                }
            }
        })

        //если элемент был найден, то перемещаем его в конец (таким образом он будет выше всех остальных, т.к. отрисовка идет с начала массива до конца)
        //и так же добавляем обработчики перемещения и отжатия клавишы мыши
        if (current != undefined) {
            items.push(items[current])
            items.splice(current, 1)
            current = items.length - 1
            document.addEventListener('mousemove', mousemove)
            document.addEventListener('mouseup', mouseup)
        }
    }

    //функция для перемещения элемента на канвасе
    //если курсор находиться за пределами канваса, то удаляем элемент и показываем фигуру под курсором    
    function mousemove(e) {
        const canvas_gbcr = canvas.getBoundingClientRect()
        if (e.clientY >= canvas_gbcr.top && e.clientY <= canvas_gbcr.top + canvas.height &&
            e.clientX >= canvas_gbcr.left && e.clientX <= canvas_gbcr.left + canvas.width) {
            let item_x = e.offsetX + x
            let item_y = e.offsetY + y

            if (item_x <= 50) item_x = 50
            if (item_x >= canvas.width - 50) item_x = canvas.width - 50
            if (item_y <= 30) item_y = 30
            if (item_y >= canvas.height - 30) item_y = canvas.height - 30

            if (current != undefined) {
                items[current].x = item_x
                items[current].y = item_y
            }
        } else {
            //если мы за пределами канваса то удаляем элемент с канваса
            //и устанавливаем current в undefined
            if (current != undefined) {
                items.splice(current, 1)
                current = undefined
            }
        }

        //если элемент удален с канваса, то перемещаем фигуру
        if (current === undefined)
            switch (type) {
                case 'ellipse':
                    ellipse.style.top = e.pageY + y - 30 + 'px'
                    ellipse.style.left = e.pageX + x - 50 + 'px'
                    break
                case 'rect':
                    rect.style.top = e.pageY + y - 30 + 'px'
                    rect.style.left = e.pageX + x - 50 + 'px'
                    break
            }
    }

    //если при отжатии кнопки мыши current равна undefined то это значит что нам нужно добавить новый элемент на канвас
    //иначе просто удаляем обработчики событий    
    //и сохраняем массив элементов в localstorage
    function mouseup(e) {
        if (current === undefined) {
            mouseup_add(e, type, x, y, 1)
            //возвращаем фигуру на исходное место и удаляем ненужные обработчики
            document.getElementById('figure_' + type).style.top = 'unset'
            document.getElementById('figure_' + type).style.left = 'unset'
        }
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        save()
    }

    //отключаем "родной" drag and drop
    canvas.ondragstart = function () {
        return false
    }
}

//функция перерисовки объектов на канвасе
//данные берутся с массива элементов
function redraw() {
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    items.forEach(element => {
        switch (element.type) {
            case 'ellipse':
                ctx.fillStyle = 'blue'
                ctx.beginPath()
                ctx.ellipse(element.x, element.y, 50, 30, 0, 0, 360)
                break
            case 'rect':
                ctx.fillStyle = 'green'
                ctx.beginPath()
                ctx.rect(element.x - 50, element.y - 30, 100, 60)
                break
        }
        ctx.fill()
        if (element.active)
            ctx.lineWidth = 3
        else
            ctx.lineWidth = 1
        ctx.strokeStyle = "black"
        ctx.stroke()
    })
}

//выполняем перерисовку 60 раз в секунду
setInterval(redraw, 16)

//функция для сохраниения масисва элементов в localstorage в виде JSON
function save() {
    localStorage.setItem('items', JSON.stringify(items))
}

//функция для очистки канваса
button_clear.onclick = function () {
    items = []
    save()
}

//функция для отслеживания нажатия клавиши delete|
//и удаления активного элемента
document.addEventListener('keydown', function (event) {
    if (event.code === 'Delete') {
        items = items.filter(i => !i.active)
    }
    save()
})

//обработчик нажатия кнопки export
//экспортирует массив элементов в файл
button_export.onclick = function () {
    const data = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items))
    const download = document.createElement('a')
    download.setAttribute("target", "_blank")
    download.setAttribute("id", "a_download")
    download.setAttribute("download", "items.json")
    download.setAttribute("href", data)
    document.body.append(download)
    download.click()
    a_download.remove()
}

//обработчик нажатия кнопки import
button_import.onclick = function () {
    input_import.click()
}

//функция для импорта массивы элементов с файла
input_import.onchange = () => {
    const file = input_import.files[0]
    if (file.type !== "application/json") {
        alert('The file is not correct')
        return
    }
    const reader = new FileReader()
    reader.readAsText(file, "utf-8")
    reader.onload = () => (items = JSON.parse(reader.result))
}