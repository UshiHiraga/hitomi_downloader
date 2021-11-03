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

    function BigCreateURLHitomi(datos_imagen_actual){
        // Convierte el hash de la imagen en una url.
        // 11032021: Hubo un cambio en la página de hitomi. Cambio en la función subdomain_from_url.
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
            
            var number_of_frontends = 2;
            var b = 16;
            
            var r = /\/[0-9a-f]\/([0-9a-f]{2})\//;
            var m = r.exec(url);
            if (!m) {
                    return 'a';
            }
            
            var g = parseInt(m[1], b);
            if (!isNaN(g)) {
                    var o = 0;
                    if (g < 0x7c) {
                            o = 1;
                    }
                    //retval = subdomain_from_galleryid(g, number_of_frontends) + retval;
                    retval = String.fromCharCode(97 + o) + retval;
            }
            
            return retval;
    }
    
        let t_url = mid_url.replace(/\/\/..?\.hitomi\.la\//, '//'+subdomain_from_url(mid_url, base)+'.hitomi.la/');
        return t_url
    }

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