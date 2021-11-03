//Adaptación del script https://ltn.hitomi.la/common.js
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