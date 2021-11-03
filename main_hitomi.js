function Main(){
    // Revisamos los datos previos.
    if(!localStorage.getItem("get_with_pdfmaker")){
        localStorage.setItem("get_with_pdfmaker", "1");
    }

    // Hacemos el request al archivo de gallery, para agilizar el proceso.
    let code = location.href.match(/[0-9]*.html/g);
    code = code[0].replace(/.html/g, "");
    fetch("//ltn.hitomi.la/galleries/" + code + ".js")
    .then(function(r){
        return r.text();
    })
    .then(function(t){
        script = t.replace("var galleryinfo = ", "");
        sessionStorage.setItem("code" + code, script);
        console.log("Hemos guardado el script.");
    })
    .catch(function(e){
        console.error(e);
    });
 
    // Creamos el primer botón de descarga.
    button.setAttribute("id", "new_download_boton");
    button.addEventListener("click", StartProcess);
    button.innerText = chrome.i18n.getMessage("mensaje_descarga");
    document.querySelector(".cover-column").appendChild(button);

    // Añadimos el diálogo de las opciones y su contenido.
    document.body.appendChild(CreateDialogItem("opciones_descarga", chrome.i18n.getMessage("mensaje_opciones_descarga")));

    // Añadimos el contenido de las opciones, en este caso, solo son checks.
    let padre = document.querySelector("#opciones_descarga .contenidoDialog");
    padre.appendChild(CreateCheckItem("get_with_pdfmaker", chrome.i18n.getMessage("label_descargar_con_pdfmake")));

    // Creamos el botón de las opciones.
    let op_bu = document.createElement("button");
    op_bu.setAttribute("id", "options_button_opener");
    op_bu.innerText = chrome.i18n.getMessage("mensaje_opciones_descarga");
    op_bu.addEventListener("click", function(){
        document.getElementById("opciones_descarga").showModal()
    });
    padre = document.querySelector(".gallery h2");
    padre.appendChild(op_bu);

};

function CreateCheckItem(id, label_text){
    // Crea los elementos check;
    let label = document.createElement("label");
    label.classList.add("chechker_values_label");
    label.innerText = label_text;
    let checher = document.createElement("input");
    checher.addEventListener("change", ChangedValue);
    checher.setAttribute("id", id);
    checher.setAttribute("type", "checkbox");
    label.appendChild(checher);

    if(localStorage.getItem(id) == true){
        checher.setAttribute("checked", "");
    }

    return label;
}

function CreateDialogItem(id, titulo){
    // Función que crea el elemento dialog.
    let actual_div, button, big_dialog;

    big_dialog = document.createElement("dialog");
    big_dialog.setAttribute("id", id);
    big_dialog.classList.add("d");

    actual_div = document.createElement("div");
    actual_div.classList.add("titleDialog");

    button = document.createElement("button");
    button.classList.add("titleText");
    button.innerText = titulo;
    actual_div.appendChild(button);

    button = document.createElement("button");
    button.setAttribute("onclick", "document.getElementById('" + id+ "').close()");
    button.innerText = "X";
    actual_div.appendChild(button);
    big_dialog.appendChild(actual_div);

    actual_div = document.createElement("div");
    actual_div.classList.add("contenidoDialog");
    big_dialog.appendChild(actual_div);
    return big_dialog
}

function ChangedValue(e){
    let new_value = e.target.checked;
    switch (e.target.id){
        case "get_with_pdfmaker":
            localStorage.setItem("get_with_pdfmaker", +new_value);
        break;

        default:
            throw new Error("Valor desconocido");
        break;
    }
};

async function StartProcess(e){
    e.preventDefault();
    // Retiramos los eventos.
    button.removeEventListener("click", function(){});
    button.innerText = chrome.i18n.getMessage("mensaje_descargando");
    button.classList.toggle("descargando");

    // Obtenemos el script gallery.
    let code = location.href.match(/[0-9]*.html/g);
    code = code[0].replace(/.html/g, "");
    let script;
    if(!sessionStorage.getItem("code" + code) || sessionStorage.getItem("code" + code) == undefined){
        script = await fetch("//ltn.hitomi.la/galleries/" + code + ".js");
        let variable = await script.text();
        script = variable.replace("var galleryinfo = ", "");
        script = JSON.parse(script);
    } else {
        script = JSON.parse(sessionStorage.getItem("code" + code));
        console.log("Copia conseguida mediante sessionStorage.");
    };
  
    sessionStorage.clear();
    console.log(script);

    function Comprobation(e){
        return e.height > e.width;
    };

    if(script.files.length > 150){
        console.log("Joder, este doujin es muy largo. ¿No crees, mi amigo?");
    }
    if(localStorage.getItem("get_with_pdfmaker") == true && !script.files.every(Comprobation)){
        console.warn("Crear los PDF por medio de PDFMake, en este caso, podría generar problemas de representación.");
    };

    // Obtenemos el valor del check que definirá el método de descarga.
    if(localStorage.getItem("get_with_pdfmaker") == true){
        Download_PDF_Make_Generate(script, 350);

        button.addEventListener("click", StartProcess);
        button.classList.toggle("descargando");
        button.innerText = chrome.i18n.getMessage("mensaje_descarga");
        console.log("Fue llamado por medio de PDFMake.");
    } else {        
        chrome.runtime.sendMessage(script, function(){
            button.addEventListener("click", StartProcess);
            button.classList.toggle("descargando");
            button.innerText = chrome.i18n.getMessage("mensaje_descarga");
            console.log("Fue llamado por medio de pestaña normal.");
        });
    }
};

function Download_PDF_Make_Generate(data, ancho_page){
    // Definimos las variables iniciales.
    const TITLE = data.title;
    const PAGES_NUM = data.files.length;
    const IMAGE_DATA = data.files;
    const BIG_ID = data.id;
    const AUTHOR = chrome.i18n.getMessage("valor_autor_campo_pdf_make");
    let i = 1;
    let doc_definition = {
        info: {
            title: BIG_ID + "_" + TITLE,
            creator: AUTHOR
        },
        pageSize: {
            width: ancho_page,
            height: "auto"
        },
        pageMargins: [0, 0, 0, 0],
        content: [],
        images: {
            final_image: chrome.i18n.getMessage("imagen_final_data")
        }
    };


    function BigCreateURLHitomi(datos_imagen_actual){
        // Convierte el hash de la imagen en una url.
        let carpeta_ruta;
        if(datos_imagen_actual.hash.length < 3){
            carpeta_ruta = datos_imagen_actual.hash;
        } else {
            let big_hash = datos_imagen_actual.hash;
            carpeta_ruta = big_hash.replace(/^.*(..)(.)$/, "$2/$1/"+ big_hash);
        }
    
        let extension = datos_imagen_actual.name.split('.').pop();
        let mid_url = 'https://a.hitomi.la/images/'+ carpeta_ruta +'.'+extension;
        let base;
    
        function subdomain_from_url(url, base) {
            var retval = 'b';
            if (base) {
                retval = base;
            }

            var b = 16;
            var r = /\/[0-9a-f]\/([0-9a-f]{2})\//;
            var m = r.exec(url);
            if (!m) {
                return 'a';
            }
            
            var g = parseInt(m[1], b);
            if (!isNaN(g)) {
                    var o = 0;
                    if (g < 0x88) {
                            o = 1;
                    }
                    if (g < 0x44) {
                            o = 2;
                    }
                    retval = String.fromCharCode(97 + o) + retval;
            }
            
            return retval;
        }
    
        let t_url = mid_url.replace(/\/\/..?\.hitomi\.la\//, '//'+subdomain_from_url(mid_url, base)+'.hitomi.la/');
        return t_url
    }

    // Primero insertamos el div donde se muestra la información.
    let big_div = document.createElement("div");
    if(!document.getElementById("pdf_maker_info_text")){
        big_div.setAttribute("id", "pdf_maker_info_text");

        // Texto del div.
        big_div.textContent += chrome.i18n.getMessage("cargando_texto", [i, PAGES_NUM]) + "\n";
        big_div.textContent += "\n" + chrome.i18n.getMessage("info_alerta_no_cerra_pestanna");
        big_div.textContent += "\n" + chrome.i18n.getMessage("alerta_demora_trabajo");
        let hermano = document.querySelector(".gallery .gallery-info");
        document.querySelector(".gallery").insertBefore(big_div, hermano);
    };

    // Definimos las funciones en caso de que falle o se logre una imagen.
    function ErrorImagen(e){
        console.log("La imagen " + e.target.id + " no cargó.");
        e.target.setAttribute("src", chrome.i18n.getMessage("imagen_error_data_base64"));
    };

    function CargaImagen(e){
        console.log("La imagen " + e.target.id + " cargó");
        // Retiramos el evento de carga de esa imagen.
        e.target.removeEventListener("load", function(){
            console.log("Evento retirado.");
        });
        e.target.removeEventListener("error", function(){
            console.log("Evento retirado.");
        });

        // Aumentamos el indice de la imagen actual.
        let img = document.createElement("img");
        i += 1;

        // Texto del div.
        big_div.innerText = chrome.i18n.getMessage("cargando_texto", [i, PAGES_NUM]);
        big_div.innerText += "\n" + chrome.i18n.getMessage("info_alerta_no_cerra_pestanna");
        big_div.innerText += "\n" + chrome.i18n.getMessage("alerta_demora_trabajo");

        // La añadimos a la definición del documento.
        doc_definition.images[e.target.id] = e.target.getAttribute("src");
        doc_definition.content.push({
            image: e.target.id,
            width: ancho_page,
            pageBreak: "after",
        });


        if(i > PAGES_NUM){
            big_div.innerText = chrome.i18n.getMessage("info_generando_archivo");
            doc_definition.content.push({
                image: "final_image",
                width: ancho_page,
            });

            pdfMake.createPdf(doc_definition).download(BIG_ID + "_" + TITLE, function(){
                big_div.innerText = chrome.i18n.getMessage("info_trabajo_finalizado");
            });

            return true;
        };
    
        // Le damos los valores a la nueva imagen.
        img.classList.add("added_images_extension_work_class");
        img.setAttribute("id", "imagen_getted_" + i);
        img.addEventListener("load", CargaImagen);
        img.addEventListener("error", ErrorImagen);
        img.setAttribute("src", BigCreateURLHitomi(IMAGE_DATA[i - 1]));
    }

    // Creamos la primer imagen y la añadimos al documento.
    let img = document.createElement("img");
    img.setAttribute("id", "imagen_getted_" + i);
    img.addEventListener("load", CargaImagen);
    img.addEventListener("error", ErrorImagen);
    img.setAttribute("src", BigCreateURLHitomi(IMAGE_DATA[i - 1]));
}

let button = document.createElement("h1");
Main();
// Desarrollado por Ushi Hiraga Inc. División Aikawa.
// Terminado el 17 de Septiembre del 2021.
// https://sites.google.com/view/ushihiraga/p%C3%A1gina-principal