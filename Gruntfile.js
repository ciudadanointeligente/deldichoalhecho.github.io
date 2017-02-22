/*global module:false*/

var request = require('request');
var fs = require('fs');
var tabletop = require('tabletop');
var public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1GvW3NM2LpsnVSGAmhRdkmiidOmfyxqLya4848Q4GRT8/pubhtml';

var current_branch = 'gh-pages';

function functiontofindIndexByKeyValue(arraytosearch, key, valuetosearch) {
    for (var i = 0; i < arraytosearch.length; i++) {

        if (arraytosearch[i][key] == valuetosearch) {
        return i;
        }
    }
    return -1;
}

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-git');
  // Project configuration.
  grunt.initConfig({
    gitcommit: {
        data: {
         options: {
             'allowEmpty': true
          },
          files: [
            {
              src: ["_data/analisis.json","_data/cumplimientos.json"],
              expand: true,
            }
          ]
        },
      },
    gitadd: {
        task: {
          options: {
            force: true
          },
          files: {
              src: ["_data/analisis.json","_data/cumplimientos.json"],
          }
        }
      },
    gitpush: {
        data: {
            options: {
                'branch': current_branch
          }
        }
      },
    gitpull: {
        data: {
            options: {
                "remote": "origin",
                "branch": current_branch
            }
        }
    }
  });

  // These plugins provide necessary tasks.

  // Default task.
    grunt.registerTask('UpdateData', 'Va a buscar las cosas a google docs y las deja en un json ◕‿◕', function() {
      var done = this.async();
      var i = tabletop.init({key: public_spreadsheet_url, callback: function(data, tabletop) {

        /*cumplimientos*/
        var all_cumplimientos = tabletop.models.cumplimiento.elements;
        var cumplimientos = []

        for (var i=0; i < all_cumplimientos.length; i++){
          if( all_cumplimientos[i].area !== null || all_cumplimientos[i].area !== "Total" || all_cumplimientos[i].area !== "" ) {
            cumplimientos.push({
              "area": all_cumplimientos[i].area,
              "total": all_cumplimientos[i].total,
              "escala": all_cumplimientos[i].escala.replace(',','.')
            })
          }
        }

        /*analisis*/
        var all_analisis = tabletop.models.analisis.elements;
        var analisis = { "nro_promesas":0, "nro_proyectos":0, "promesas_con_proyectos":0, "promesas_areas":0, "capacidad":0, "promedio_avance":0, "promedio_coherencia":0, "nro_urgencias":0, "promisses": [] };
        var current_category = '';

        // totales
        var totales = tabletop.models.totales.elements;
        analisis.nro_promesas = totales[0].nro_promesas;
        analisis.nro_proyectos = totales[0].nro_proyectos;
        analisis.promesas_con_proyectos = totales[0].promesas_con_proyectos;
        analisis.promesas_areas = totales[0].promesas_areas;
        analisis.capacidad = totales[0].capacidad;
        analisis.promedio_avance = totales[0].promedio_avance;
        analisis.promedio_coherencia = totales[0].promedio_coherencia;
        analisis.nro_urgencias = totales[0].nro_urgencias;

        for (var y=1,i=0; i < all_analisis.length; i++){
          if( all_analisis[i].area !== '' && current_category != all_analisis[i].area ) {
            analisis.promisses.push({"id": y++, "category": all_analisis[i].area, "avance_total":"", "coherencia":"", "status":{ "completas": 0, "incompletas": 0, "sin_progreso": 0 }, "data":[]})
          }

          if(current_category != all_analisis[i].area) {
            current_category = all_analisis[i].area;
          }
        }

        for (var x=0; x < analisis.promisses.length; x++){
          for (var i=0; i < all_analisis.length; i++){
            if(all_analisis[i].uid != '' && analisis.promisses[x].category == all_analisis[i].area) {
              analisis.promisses[x].data.push({ "id": all_analisis[i].uid, "titulo": all_analisis[i].titulo, "promesa": all_analisis[i].promesa, "boletin": all_analisis[i].boletin, "total_urgencias": all_analisis[i].total_urgencias ,"avance_total": all_analisis[i].avance_total, "coherencia": all_analisis[i].coherencia, "nombre_avance": all_analisis[i].nombre_avance, "link":all_analisis[i].link, "justificacion_avance": all_analisis[i].justificacion_avance, "justificacion_nota": all_analisis[i].justificacion_nota })
              if(all_analisis[i].avance_total === "0%")
                analisis.promisses[x].status.sin_progreso = analisis.promisses[x].status.sin_progreso+1;
              if(all_analisis[i].avance_total === "40%" || all_analisis[i].avance_total === "70%" || all_analisis[i].avance_total === "90%")
                analisis.promisses[x].status.incompletas = analisis.promisses[x].status.incompletas+1;
              if(all_analisis[i].avance_total === "100%")
                analisis.promisses[x].status.completas = analisis.promisses[x].status.completas+1;
            }
          }

          var ct = 0;
          var coht = 0;
          for (var y=1, i=0; i < all_analisis.length; i++){
            if(all_analisis[i].coherencia != ''){
            if(all_analisis[i].uid != '' && analisis.promisses[x].category == all_analisis[i].area) {
              var tmp_ct = parseInt(all_analisis[i].avance_total);
              var tmp_coht = parseInt(all_analisis[i].coherencia);
              var tmp_y = y++;

              ct = tmp_ct + ct ;
              final_ct = ct / tmp_y;

              coht = tmp_coht + coht ;
              final_coht = coht / tmp_y;

              analisis.promisses[x].avance_total = Math.round(final_ct);
              analisis.promisses[x].coherencia = final_coht.toFixed(1);
            }}
          }
        }

        /*save files*/
        grunt.file.write("_data/cumplimientos.json", JSON.stringify(cumplimientos, null, 4));
        grunt.log.ok("_data/cumplimientos.json")
        grunt.file.write("_data/analisis.json", JSON.stringify(analisis, null, 4));
        grunt.log.ok("_data/analisis.json")
        grunt.file.write("data/analisis.json", JSON.stringify(analisis, null, 4));
        grunt.log.ok("data/analisis.json")
      }, simpleSheet: true})
    });

    grunt.registerTask("default", ['UpdateData'])
    // , 'gitadd', 'gitcommit', 'gitpull', 'gitpush'


};
