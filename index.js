const ctx = canvas.getContext('2d')
let items = JSON.parse(localStorage.getItem('items')) || []

document.onmousedown = function (e) {
    let element = document.elementFromPoint(e.clientX, e.clientY)
    switch (element) {
        case ellipse:
            figuresMove(e, ellipse)
            break;
        case rect:
            figuresMove(e, rect)
            break;
        case canvas:
            canvasMove(e)
            break;
    }
}

function figuresMove(e, elem) {
    const elem_gbcr = elem.getBoundingClientRect()
    const x = e.clientX - elem_gbcr.left;
    const y = e.clientY - elem_gbcr.top;

    document.addEventListener('mousemove', mousemove);
    elem.addEventListener('mouseup', mouseup)

    function mousemove(e) {
        elem.style.left = e.pageX - x + 'px';
        elem.style.top = e.pageY - y + 'px';
    }

    function mouseup(e) {
        const canvas_gbcr = canvas.getBoundingClientRect()
        if (e.clientY >= canvas_gbcr.top && e.clientY <= canvas_gbcr.top + canvas.height &&
            e.clientX >= canvas_gbcr.left && e.clientX <= canvas_gbcr.left + canvas.width) {

            const item_x = e.clientX - canvas_gbcr.left;
            const item_y = e.clientY - canvas_gbcr.top;

            if (item_x <= 50) item_x = 50;
            if (item_x >= canvas.width - 50) item_x = canvas.width - 50;
            if (item_y <= 30) item_y = 30;
            if (item_y >= canvas.height - 30) item_y = canvas.height - 30;

            items = items.map((i) => {
                i.active = false
                return i
            })
            items.push({
                active: true,
                type: elem.id,
                x: item_x - (x - 51),
                y: item_y - (y - 31)
            })
            console.log(items)
            save();
        }

        elem.style.top = 'unset';
        elem.style.left = 'unset';
        document.removeEventListener('mousemove', mousemove)
        elem.removeEventListener('mouseup', mouseup)
    }

    elem.ondragstart = function () {
        return false;
    };
}

function canvasMove(e) {
    const canvas_gbcr = canvas.getBoundingClientRect()
    let current
    let remove = false;
    let x;
    let y;
    if (e.clientY >= canvas_gbcr.top && e.clientY <= canvas_gbcr.top + canvas.height &&
        e.clientX >= canvas_gbcr.left && e.clientX <= canvas_gbcr.left + canvas.width) {
        const item_x = e.clientX - canvas_gbcr.left;
        const item_y = e.clientY - canvas_gbcr.top;

        items.forEach((element, index) => {
            if (element.x > item_x - 50 && element.x < item_x + 50 &&
                element.y > item_y - 30 && element.y < item_y + 30) {
                x = element.x - item_x;
                y = element.y - item_y;
                current = index;
                if (e.button == 0) {
                    items = items.map((i) => {
                        i.active = false
                        return i
                    })
                    element.active = !element.active;
                }
            }
        })

        if (current != undefined) {
            items.push(items[current])
            items.splice(current, 1)
            current = items.length - 1
            document.addEventListener('mousemove', mousemove)
        }
    }

    function mousemove(e) {
        const canvas_gbcr = canvas.getBoundingClientRect()
        if (e.clientY >= canvas_gbcr.top && e.clientY <= canvas_gbcr.top + canvas.height &&
            e.clientX >= canvas_gbcr.left && e.clientX <= canvas_gbcr.left + canvas.width) {
            let item_x = e.layerX + x;
            let item_y = e.layerY + y;

            if (item_x <= 50) item_x = 50;
            if (item_x >= canvas.width - 50) item_x = canvas.width - 50;
            if (item_y <= 30) item_y = 30;
            if (item_y >= canvas.height - 30) item_y = canvas.height - 30;

            items[current].x = item_x;
            items[current].y = item_y;
            remove = false;
        } else {
            remove = true;
        }
    }

    document.addEventListener('mouseup', mouseup)

    function mouseup(e) {
        if (remove) {
            items.splice(current, 1)
        }
        document.removeEventListener('mousemove', mousemove)
        document.removeEventListener('mouseup', mouseup)
        save()
    }

    canvas.ondragstart = function () {
        return false;
    };
}

function redraw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    items.forEach(element => {
        switch (element.type) {
            case 'ellipse':
                ctx.fillStyle = 'blue';
                ctx.beginPath();
                ctx.ellipse(element.x, element.y, 50, 30, 0, 0, 360);

                break;
            case 'rect':
                ctx.fillStyle = 'green';
                ctx.beginPath();
                ctx.rect(element.x - 50, element.y - 30, 100, 60);
                break;
        }
        ctx.fill();
        if (element.active)
            ctx.lineWidth = 3;
        else
            ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.stroke();
    });
}

setInterval(() => {
    redraw()
}, 10)

function save() {
    localStorage.setItem('items', JSON.stringify(items));
}

document.addEventListener('keydown', function (event) {
    if (event.code == 'Delete') {
        items = items.filter(i => !i.active)
    }
    save()
});

button_export.onclick = function () {
    const data = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
    const download = document.createElement('a')
    download.setAttribute("target", "_blank")
    download.setAttribute("id", "a_download")
    download.setAttribute("download", "items.json")
    download.setAttribute("href", data);
    document.body.append(download);
    download.click();
    a_download.remove()
}

button_import.onclick = function () {
    input_import.click()
}

input_import.onchange = () => {
    const file = input_import.files[0]
    if (file.type !== "application/json") {
        alert('The file is not correct')
        return
    }

    const reader = new FileReader();
    reader.readAsText(file, "utf-8");
    reader.onload = () => (items = JSON.parse(reader.result));
}