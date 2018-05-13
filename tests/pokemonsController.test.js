
describe('pokemons', function() {
	var httpBackend,
			tpokeApi,
			$controller,
			$scope={},
			rootScope={},
			templateCache,
			viewHtml,
			$compile,
			formElement,
			element,
			httpProvider;
	beforeEach(module('pokeapp','test-templates',function($httpProvider){
		httpProvider = $httpProvider;
	}));

	beforeEach(inject(function(_$compile_,_$controller_, $httpBackend, _pokeapi_,_$route_, _$location_,$rootScope,$templateCache) {
		httpBackend = $httpBackend;
		$compile = _$compile_;
		$controller = _$controller_;
		tpokeApi = _pokeapi_;
		$route = _$route_;
		$location = _$location_;
		templateCache = $templateCache;
		rootScope = $rootScope.$new();
	}));

	//beforeEach(module('ngMockE2E'));

		describe('HTTP Tests', function() {
			it('should have the RequestService as an interceptor', function () {
          expect(httpProvider.interceptors).toContain('pokeTestHttpInterceptor');
      });
		})

		describe('Routing Tests', function() {
			it('Template url should be \'views/pokemons.html\' ', function(){
				rootScope.$apply(function() {
					$location.path('/');
				});
				expect($route.current.templateUrl).toEqual('views/pokemons.html');
			});

			//for otherwise route
			it('Template url should be \'views/pokemons.html\' ', function(){
				rootScope.$apply(function() {
					$location.path('/lubiedrzemka');
				});
				expect($route.current.templateUrl).toEqual('views/pokemons.html');
			});

			it('Template url should be \'views/pokemon.html\' ', function(){
				rootScope.$apply(function() {
					$location.path('/pokemon/1-bulsaur');
				});
				expect($route.current.templateUrl).toEqual('views/pokemon.html');
			});
		})

	describe('pokeApi Service', function() {

		it('Pagination Works', inject(function($http) {
			controller = $controller('pokemonsController', {
				$scope: $scope
			});
			httpBackend.whenGET("http://pokeapi.co/api/v2/pokemon/?limit=20").respond(window.pokemons);
			for (var i in window.pokemons.results) {
				httpBackend.whenGET(window.pokemons.results[i].url).respond(window.pokemon);
			}
			$scope.load('http://pokeapi.co/api/v2/pokemon/?limit=20');
			httpBackend.flush();
			expect($scope.nextUrl).toEqual(window.pokemons.next);
		}));

		it('Remaining Posts Count is correct', inject(function($http) {
			controller = $controller('pokemonsController', {
				$scope: $scope
			});
			httpBackend.whenGET("http://pokeapi.co/api/v2/pokemon/?limit=20").respond(window.pokemons);
			for (var i in window.pokemons.results) {
				httpBackend.whenGET(window.pokemons.results[i].url).respond(window.pokemon);
			}
			$scope.load('http://pokeapi.co/api/v2/pokemon/?limit=20');
			httpBackend.flush();
			expect($scope.remCount).toEqual(window.pokemons.count - window.pokemons.results.length);
		}));

		it('Get Pokemon Works', inject(function($route, $location,$http) {
			httpBackend.whenGET("http://pokeapi.co/api/v2/pokemon/1/").respond(window.pokemon);
			rootScope.$apply(function() {
				$location.path('/pokemon/1-bulsaur');
			});
			controller = $controller('pokemonController', {
				$scope: $scope,
				$routeParams: $route.current.params
			});
			httpBackend.flush();
			expect($scope.pokemon).toEqual(window.pokemon);
		}));

	});


	describe('DOMTests', function() {
		it('Set Pagetitle to \'Pokemons\' at init', inject(function($route, $location,$http) {
			httpBackend.whenGET("http://pokeapi.co/api/v2/pokemon/?limit=20").respond(window.pokemons);
			controller = $controller('pokemonsController', {
				$scope: $scope,
			});
			viewHtml = templateCache.get('views/pokemons.html');
			formElement = angular.element(viewHtml);
			element = $compile(formElement)(rootScope);
			rootScope.$digest();
			expect(rootScope.pageTitle).toEqual('Pokemons');
		}));

		it('Set Pagetitle to Pokemon\'s name works', inject(function($route, $location,$http) {
			httpBackend.whenGET("http://pokeapi.co/api/v2/pokemon/1/").respond(window.pokemon);
			rootScope.$apply(function() {
				$location.path('/pokemon/1-bulsaur');
			});
			controller = $controller('pokemonController', {
				$scope: $scope,
				$routeParams: $route.current.params
			});
			viewHtml = templateCache.get('views/pokemon.html');
			formElement = angular.element(viewHtml);
			element = $compile(formElement)(rootScope);
			rootScope.$digest();
			httpBackend.flush();
			expect(rootScope.pageTitle).toEqual($scope.pokemon.name);
		}));
	})

});