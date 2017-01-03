'use strict';

/**
 * @ngdoc service
 * @name musicDegreesApp.apiService
 * @description
 * # apiService
 * Factory in the musicDegreesApp.
 */
angular.module('musicDegreesApp')
  .factory('apiService', function ($q, $http) {

    // Public API here
    return {
      getRelated : function(url){
        var deferred = $q.defer();
        var headers = {}

        $http.get(url,headers)
          .then(function onSuccess(response) {
            // console.log(response);
            // Handle success
            var data = response.data;
            deferred.resolve(data);
          })
          .catch(function onError(response) {
            console.log(response);
            if (response.status == 429) {
              console.log('timeout')
            }
            // Handle error
            var data = response.data;
            deferred.reject("An error occured while fetching file",error);
          })

        return deferred.promise;
      },
      getArtist : function(id){
        var url = 'https://api.spotify.com/v1/artists/{id}/'
        url = url.replace('{id}',id)
        var deferred = $q.defer();

        $http.get(url)
          .then(function onSuccess(response) {
            // Handle success
            var data = response.data;
            deferred.resolve(data);
          })
          .catch(function onError(response) {
            console.log(response);
            // Handle error
            var data = response.data;
            deferred.reject("An error occured while fetching file",error);
          })

        return deferred.promise;
      },
    };
  });
