var app = angular.module('webApp', ['ngSanitize'], function($interpolateProvider) {
  $interpolateProvider.startSymbol('[[');
  $interpolateProvider.endSymbol(']]');
});
app.directive('tooltip', function(){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            $(element).hover(function(){
                // on mouseenter
                $(element).tooltip('show');
            }, function(){
                // on mouseleave
                $(element).tooltip('hide');
            });
        }
    };
});

app.controller('cumplimientoController', function($scope,$http,$location,$anchorScroll){
  $scope.analisis = [];
  $scope.hash = '';
  $http.get('/data/analisis.json')
      .success(function (data) {
        $scope.analisis = data;
        $scope.hash = window.location.hash.slice(2);
        $location.hash($scope.hash);
        $anchorScroll();
      })
      .error(function (){
        $scope.messages = { response: false, message: 'no org loaded' }
      });
});
