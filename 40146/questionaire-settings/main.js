(function(){
	'use strict';

	angular
		.module('questionaire.settings', [])
		.directive('ciQuestionaireSettings', questionaireSettings);

	var questionaireSettings = function(){
		return {
			restrict: 'AE',
			templateUrl: 'views/src/htmlAndControllers/common/questionaire-settings/main.tpl.html',
			controller: CiQuestionaire.Controller
		}
	};

})();