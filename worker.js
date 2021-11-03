function Installed(){
    console.log("La extensión fue instalada.");
};

async function Message(mensaje){
    let tab = await chrome.tabs.create({
        "url": "https://hitomi.la/descargando-doujin",
        "active": false
    });
    main_trabajos["tab" + tab.id] = mensaje;
    console.log("Esperamos a que la pestaña cargue.");
};

function TabsUpdated(tab_id, cambios, tab){
    if(cambios.status == "complete" && tab.url == "https://hitomi.la/descargando-doujin" && tab.status == "complete"){
        console.log("Sí, es nuestra pestaña");

        if(!main_trabajos["tab" + tab_id]){
            chrome.tabs.remove(tab_id);
            throw new Error("No existe un trabajo preparado para esta pestaña.");
        }

        let send_data = main_trabajos["tab" + tab_id];
        delete main_trabajos["tab" + tab_id];
        console.log(send_data);

        chrome.scripting.executeScript({
            target: {tabId: tab_id},
            func: MainDrawImages_Hitomi,
            args: [send_data]
        }, function(a){
            console.log(a);
        });
    }
};


function MainDrawImages_Hitomi(data){
    // Definimos las variables iniciales.
    const TITLE = data.title;
    const PAGES_NUM = data.files.length;
    const IMAGE_DATA = data.files;
    const BIG_ID = data.id;
    let i = 1;

    // Ponemos el título de la página.
    document.body.classList.add("images_body");
    document.title = BIG_ID + "_" + TITLE;

    // Creamos la pantalla de carga.
    let popup, texto;
    popup = document.createElement("dialog");
    popup.setAttribute("id", "splash");
    document.body.appendChild(popup);
    popup.showModal();

    // Anadimos el texto.
    texto = chrome.i18n.getMessage("cargando_texto", [i, PAGES_NUM]);
    popup.innerText = texto;
    texto =  "\n" + chrome.i18n.getMessage("seleccionar_impresora_mensaje");
    popup.innerText += texto;
    texto = "\n" + chrome.i18n.getMessage("alerta_demora_trabajo");
    popup.innerText += texto;

    // Creamos la primer imagen y la añadimos al documento.
    let img = document.createElement("img");
    img.classList.add("added_images_extension_work_class");
    img.setAttribute("id", "imagen_getted_" + i);
    img.setAttribute("title", "Imagen Nro. " + i + " del doujin.");
    img.setAttribute("alt", "Imagen Nro. " + i + " del doujin.");
    img.addEventListener("load", CargaImagen);
    img.addEventListener("error", ErrorImagen);
    img.setAttribute("src", BigCreateURLHitomi(IMAGE_DATA[i - 1]));

    // Revisamos si está vertical u horizontal.
    if(IMAGE_DATA[i - 1].height > IMAGE_DATA[i - 1].width){
        img.classList.add("vertical");
    } else {
        img.classList.add("horizontal");
    };

    // Añadimos la imagen.
    document.body.appendChild(img);

    function ErrorImagen(e){
        console.log("La imagen " + e.target.id + " no cargó.");
        e.target.setAttribute("src", chrome.i18n.getMessage("imagen_error_data_base64"));
    }

    function CargaImagen(e){
        // Retiramos el evento de carga de esa imagen.
        console.log("La imagen " + e.target.id + " cargó");
        e.target.removeEventListener("load", function(){
            console.log("Evento retirado.");
        });
        e.target.removeEventListener("error", function(){
            console.log("Evento retirado.");
        });

        // Aumentamos el índice de la imagen actual.
        i += 1;
        let img = document.createElement("img");
        if(i > PAGES_NUM){
            img.classList.add("added_images_extension_work_class");
            img.classList.add("vertical");
            img.setAttribute("src", chrome.i18n.getMessage("imagen_final_data"));
            document.body.appendChild(img);

            img.onload = function(){
                popup.close();
                window.print();
            };
            return true;
        };
    
        // Le damos los valores a la nueva imagen.
        img.classList.add("added_images_extension_work_class");
        img.setAttribute("id", "imagen_getted_" + i);
        img.setAttribute("title", "Imagen Nro. " + i + " del doujin.");
        img.setAttribute("alt", "Imagen Nro. " + i + " del doujin.");
        img.addEventListener("load", CargaImagen);
        img.addEventListener("error", ErrorImagen);
    
        // Añadimos la url.
        let url = BigCreateURLHitomi(IMAGE_DATA[i - 1]);
        img.setAttribute("src", url);
    
        // Revisamos si está vertical u horizontal.
        if(IMAGE_DATA[i - 1].height > IMAGE_DATA[i - 1].width){
            img.classList.add("vertical");
        } else {
            img.classList.add("horizontal");
        };
        document.body.appendChild(img);

        //Actualizamos el texto.
        texto = chrome.i18n.getMessage("cargando_texto", [i, PAGES_NUM]);
        popup.innerText = texto;
        texto =  "\n" + chrome.i18n.getMessage("seleccionar_impresora_mensaje");
        popup.innerText += texto;
        texto = "\n" + chrome.i18n.getMessage("alerta_demora_trabajo");
        popup.innerText += texto;
    }
}

let main_trabajos = {};
chrome.tabs.onUpdated.addListener(TabsUpdated);
chrome.runtime.onMessage.addListener(Message);
chrome.runtime.onInstalled.addListener(Installed);
// Desarrollado por Ushi Hiraga Inc. División Aikawa.
// Terminado el 17 de Septiembre del 2021.
// https://sites.google.com/view/ushihiraga/p%C3%A1gina-principal