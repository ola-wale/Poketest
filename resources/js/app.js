var app = angular.module('pokeapp', ['ngRoute', 'angular-loading-bar']);
var errorTexts = {404:'Sorry, This Pokemon doesn\'t exist.'}
/**
 * HTTP Request interceptor
 */
app.factory('pokeTestHttpInterceptor', function($q, $rootScope) {
	return {
		request: function(config) {
			$rootScope.doingAjax = true;
			return config;
		},
		response: function(config) {
			$rootScope.doingAjax = false;
			return config;
		},
		responseError: function(response) {
			/**
			 * If a Mainstream request fails, then there'll be nothing to display, enable 'errors' - this'll show a div on the page telling the user an error has occurred asking them to try refreshing.
			 */
			if (typeof response.config /**karmafix**/ !== 'undefined' && typeof response.config.headers.Authorization !== 'undefined' && response.config.headers.Authorization == 'Mainstream') {
				$rootScope.error = true;
				if(typeof response.status !== 'undefined' && response.status == 404){
					$rootScope.errorText = errorTexts[response.status];
				}
			}
			return $q.reject(response);
		}
	};
});

/**
 * Routing Config
 */
app.config(function($httpProvider, $routeProvider, $locationProvider) {
	$locationProvider.hashPrefix('');
	$routeProvider
		.when("/:offset?", {
			templateUrl: "views/pokemons.html",
			reloadOnSearch:false
		})
		.when("/pokemon/:id/:name", {
			templateUrl: "views/pokemon.html"
		})
		.otherwise({
			controller:'pokemonsController',
			templateUrl: "views/pokemons.html"
		})
	$httpProvider.interceptors.push('pokeTestHttpInterceptor');
});


app.run(function($rootScope) {
	/**
	 * Creates an array with {num} number of elements
	 * @return {Array} New Array
	 */
	$rootScope.pRange = function(num) {
		var intNum = parseInt(num);
		return new Array(intNum);
	}

	$rootScope.statListAbles = {
		'Weight': 'weight',
		'Height': 'height'
	};

	$rootScope.metaListAbles = {
		'Happiness': 'base_happiness',
		'Capture Rate': 'capture_rate'
	};

	$rootScope.$on('cfpLoadingBar:completed', function() {
		$rootScope.pageLoaded = true;
	})
	$rootScope.$on('cfpLoadingBar:loading', function() {
		$rootScope.pageLoaded = false;
	})
})

/**
 * PokeApi Api Service
 */
app.service('pokeapi', function($http) {
	/**
	 * Get all pokemons
	 * @param  {String} url Api url
	 * @return {Promise}
	 */
	this.getPokemons = function(url) {
		return $http.get(url, {
			headers: {
				'Authorization': 'Mainstream', //Mainstream requests are requests fetching the 'main' data - if a Mainstream request fails, then there'll be nothing to display
			}
		});
	}
	/**
	 * Get a pokemon with its id
	 * @param  {number} pokeId Pokemon ID
	 * @return {Promise}
	 */
	this.getPokemon = function(pokeId) {
		return $http.get("https://pokeapi.co/api/v2/pokemon/" + pokeId + '/', {
			headers: {
				'Authorization': 'Mainstream', //Mainstream requests are requests fetching the 'main' data - if a Mainstream request fails, then there'll be nothing to display
			}
		}); //pokeapi 301 redirects requests without the last /
	}
	/**
	 * Get Pokemon Species with its ID
	 * @param  {number} pokeId Pokemon ID
	 * @return {Promise}
	 */
	this.getSpecieMeta = function(pokeId) {
		return $http.get("https://pokeapi.co/api/v2/pokemon-species/" + pokeId + '/'); //pokeapi 301 redirects requests without the last /
	}
});

/**
 * Pokemons (Main Page/Index Route) Controller
 */
app.controller('pokemonsController', function($scope, pokeapi, $location,$routeParams,$route) {
	$scope.pokemons = [];
	var tempArray = {};
	/**
	 * Get all pokemons
	 * @param  {String} url Query URL - Mostly for use with pagination
	 */
	$scope.load = function(url) {
		/**
		 * for pagination - commented because this would cause too many requests (e429),
		 * an alternative is to throttle requests,
		 * but this will keep users waiting for a long time depending on the offset :/
		 * so single pokemon page will be opened in a new tab -- see line 171
		 $location.search('offset', parseInt($routeParams.offset) += 20);
		*/
		pokeapi.getPokemons(url).then(function(response) {
			$scope.nextUrl = response.data.next;
			tempArray = response.data.results;
			for (var i in tempArray) {
				tempArray[i]['id'] = $scope.pokemons.length + 1;
				$scope.pokemons.push(tempArray[i]);
				if (i == tempArray.length - 1) {
					for (var i in tempArray) {
						pokeapi.getPokemon(tempArray[i]['id']).then(function(response) {
							$scope.pokemons[response.data.id - 1]['meta'] = response.data;
						})
					}
				}
			}
			$scope.remCount = response.data.count - $scope.pokemons.length;
		})
	}

	/**
	 * for pagination - commented because this would cause too many requests (e429),
	 * an alternative is to throttle requests,
	 * but this will keep users waiting for a long time depending on the offset :/
	 * so single pokemon page will be opened in a new tab -- see line 171
	 if($routeParams.offset){
	 	$scope.loadLink = 'https://pokeapi.co/api/v2/pokemon/?limit='+$routeParams.offset;
	 	$scope.load($scope.loadLink);
	 }
	*/

	/**
	 * change location.path to pokemon/{pokemonId} - using in anchor tag under <tr>'s would render the html invalid - alternative
	 * @param  {[type]} pokemonId [description]
	 * @return {[type]}           [description]
	 */
	$scope.openPokemonPage = function(pokemonId,pokemonName) {
		window.open('#pokemon/' + pokemonId + '/' + encodeURIComponent(pokemonName), '_blank').focus();
	}

})

/**
 * URI encode filter
 */
app.filter('escape', function() {
  return function(input){
		return encodeURIComponent(input);
	}
});

/**
 * Pokemon Template Controller
 */
app.controller('pokemonController', function($scope, pokeapi, $http, $routeParams,$rootScope) {
	$scope.pokemon = {};
	var _tempTexts = [];
	var tempTexts = [];
	/**
	 * Get pokemon data using id in routeParams
	 */
	pokeapi.getPokemon(parseInt($routeParams.id)).then(function(response) {

		$scope.pokemon = response.data;
		/**
		 * if the current pokemon name doesn't match the name in the name route param
		 */
		if($scope.pokemon.name != $routeParams.name){
			$rootScope.error = true;
			$rootScope.errorText = errorTexts[404];
			return;
		}
		$scope.pokemon['poll_url'] = response.data;
		$scope.pokemon['items_held'] = [];
		for (var i in $scope.pokemon.held_items) {
			$http.get($scope.pokemon.held_items[i].item.url).then(function(response) {
				$scope.pokemon['items_held'].push(response.data);
			});
		}
		/**
		 * Get the current pokemon specie data using the current pokemon ID.
		 */
		pokeapi.getSpecieMeta($routeParams.id).then(function(response) {
			$scope.specieMeta = response.data;
			/**
			 * Loop through each flavor text obj
			 */
			for (var i in $scope.specieMeta['flavor_text_entries']) {
				/**
				 * if this flavor text is in english and {_tempTexts} doesn't contain this flavor text.
				 */
				if ($scope.specieMeta['flavor_text_entries'][i].language.name == 'en' && _tempTexts.indexOf($scope.specieMeta['flavor_text_entries'][i].flavor_text.replace(/\r?\n|\r|\s/g, '').toLowerCase()) == -1) {
					tempTexts.push($scope.specieMeta['flavor_text_entries'][i].flavor_text.replace(/\n(\r\n|\n|\r)/gm, ''));
					_tempTexts.push($scope.specieMeta['flavor_text_entries'][i].flavor_text.replace(/\r?\n|\r|\s/g, '').toLowerCase()); //duplicated so I can prevent duplicates - the PokeApi duplicates some resource text, this can be seen here : https://pokeapi.co/api/v2/pokemon-species/1/
				}
				/**
				 * If this is the last iteration
				 */
				if (i == $scope.specieMeta['flavor_text_entries'].length - 1) {
					$scope.pokemon['about'] = tempTexts;
				}
			}

			//get evolution chain
			$http.get($scope.specieMeta.evolution_chain.url).then(function(response) {
				//store the result in an array we'll use temporarily
				tempArray = response.data;
				//if there's an evolution chain
				if (tempArray.chain.evolves_to[0].evolves_to.length) {
					//store evolution species & required levels in an array
					$scope.pokemon['evolves_to'] = [{
						'specie': tempArray.chain.evolves_to[0].evolves_to[0].species,
						'lvl': tempArray.chain.evolves_to[0].evolves_to[0].evolution_details[0].min_level
					}, {
						'specie': tempArray.chain.evolves_to[0].species,
						'lvl': tempArray.chain.evolves_to[0].evolution_details[0].min_level
					}];
					//can easily take the ID from the object, but there are going to be errors if the API structure changes so let's poll the API again to get the ID
					//new empty array
					$scope.pokemon['evolves_into'] = [];
					//loop through each evolution chain and species
					for (var i in $scope.pokemon['evolves_to']) {
						//poll the specie url
						if ($scope.pokemon['evolves_to'][i].specie.name == $scope.pokemon.name) {
							return;
						}
						$http.get($scope.pokemon['evolves_to'][i].specie.url).then((function(i) {
							return function(response) {
								//get the specie id
								//we've gotten the id, let's poll the api using the pokeapi service to get the pokemon with the id
								pokeapi.getPokemon(response.data.id).then((function(i) {
									return function(response) {
										response.data['lvl'] = $scope.pokemon['evolves_to'][i].lvl;
										$scope.pokemon['evolves_into'].push(response.data);
									}
								})(i));
							}
						})(i));
					}
				}
			})
		})
	})
})