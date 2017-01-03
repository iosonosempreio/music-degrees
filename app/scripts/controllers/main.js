'use strict';

/**
 * @ngdoc function
 * @name musicDegreesApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the musicDegreesApp
 */
angular.module('musicDegreesApp')
  .controller('MainCtrl', function ($scope, $http, apiService) {

    var spotifyApi = new SpotifyWebApi();

	  $scope.selected = {};

	  $scope.selected.left;
	  $scope.selected.right;

	  $scope.disable = {
      'goBtn':true,
      'chart':false,
      'cancelSearch':true
    }

    $scope.return = false;

    var myDelay = 1000;

	  // Any function returning a promise object can be used to load values asynchronously
		$scope.searchArtists = function(queryTerm) {
			if (queryTerm) {
				return spotifyApi.searchArtists(queryTerm, {limit: 10})
			    .then(function(data) {
			    	// console.log(data);
			      return data.artists.items
			    }, function(err) {
			      console.error(err);
			    });
			  }
		}

	  $scope.modelOptions = {
	    debounce: {
	      default: 500,
	      blur: 250
	    },
	    getterSetter: true
	  };

	  $scope.getShortestPath = function(proceed) {
      try {
        var path = jsnx.bidirectionalShortestPath($scope.jsnxGraph, $scope.selected.left.id, $scope.selected.right.id);
        $scope.disable.cancelSearch = true;
        $scope.selected.all = [];
        function fetchConductivesArtists(index) {
        	apiService.getArtist(path[index])
        		.then(function(data){
        				// console.log(data);
        				$scope.selected.all.push(data);
        				if(index >= path.length-1){
        					console.log($scope.selected.all);
        				} else {
        					counter++;
        					fetchConductivesArtists(counter);
        				}
        			},function(error){
        				console.error(error);
        			});
        }
        var counter=0;
        fetchConductivesArtists(counter);

      }
      catch(err) {
        if(err.name != 'JSNetworkXNoPath'){
          console.error(err)
        }
        var error = err
        if(!path&&error.name == 'JSNetworkXNoPath'&&proceed==true){
          setTimeout($scope.fetchRelated(),myDelay)
        } else {
          console.log('no path found at this stage')
        }
      }
    }

    $scope.fetchRelated = function() {
    	console.log("fetchRelated");
      $scope.disable['goBtn'] = true;
      $scope.disable.chart = true;
      $scope.disable.cancelSearch = false;
      var discoveredArtists = []
      var discovered = []
      var newNodesRaw = []
      var newEdgesRaw = []
      $scope.fetchCounter = 0

      function fetchingSync(index){
      	if ($scope.selected.all) {
      		$scope.selected.all = undefined
      	}
        // console.log($scope.toFetch[index])
        var thisArtist = $scope.toFetch[index]
        $scope.fetched.push(thisArtist.id)
        var url = 'https://api.spotify.com/v1/artists/{id}/related-artists'.replace('{id}',thisArtist.id)

        // console.log('start call')
        apiService.getRelated(url).then(
          function(data){
            // save data and make calculations
            data.artists.forEach(function(a,i){
              var thisNode = {
                'id':a.id,
                'label':a.name
              }
              var thisEdge = {
                'id':thisArtist.id+'-'+a.id,
                'source':thisArtist.id,
                'target':a.id
              }

              newNodesRaw.push(thisNode)
              newEdgesRaw.push(thisEdge)

              discoveredArtists.push(a)
              discovered.push(a.id)
            });

            // console.log('Done', $scope.fetchCounter+1,'/',$scope.toFetch.length)
            $scope.fetchCounter++
            $scope.progress = (($scope.fetchCounter+1)*100)/$scope.toFetch.length
            if ($scope.fetchCounter<$scope.toFetch.length && !$scope.return){
              fetchingSync($scope.fetchCounter)
            }
            else if (!$scope.return) {
              // do stuff
              $scope.fetchCounter--;
              $scope.progress = (($scope.fetchCounter+1)*100)/$scope.toFetch.length
              console.log('All done, ', $scope.fetchCounter)

              // create network in jsnx
              console.log('calculating network with jnsx')
              var subG = new jsnx.Graph();
              newNodesRaw.forEach(function(n){
                subG.addNode(n.id,{'label':n.label,'id':n.id});
              })
              newEdgesRaw.forEach(function(l){
                subG.addEdge(l.source,l.target,{'id':l.id});
              })
              $scope.jsnxGraph = jsnx.compose($scope.jsnxGraph, subG)
              $scope.jsnxGraphInfo = jsnx.info($scope.jsnxGraph)
              console.log(jsnx.degreeHistogram($scope.jsnxGraph))

              console.log('calculating next search')
              $scope.fetchCounter = 0;
              $scope.toFetch = []
              var newToFetch = _.pullAll(discovered,$scope.fetched);
              newToFetch.forEach(function(a){
                var _new = {'id':a}
                $scope.toFetch.push(_new)
              })

              console.log('to fetch', $scope.toFetch.length, '/', discoveredArtists.length)
              console.log('network', $scope.network)
              console.log('calculating shortest path (if exists)')
              $scope.getShortestPath(true);

            }
          },
          function(error){
            console.log('Error', error)
        });
      }
      fetchingSync($scope.fetchCounter);
    }

	  $scope.$watch('selected', function(newValue, oldValue) {
	    if ( newValue !== oldValue) {
	    	if ( newValue.left && newValue.right && newValue.left.id != newValue.right.id ) {
	      	$scope.toFetch = [newValue.left,newValue.right];
	      	$scope.jsnxGraph = new jsnx.Graph()
	        $scope.fetched = []
	        $scope.conductiveNodes = undefined;
	        $scope.disable['goBtn'] = false;
	        $scope.progress = 0;
	    	}
	    }
	  }, true);

  });
