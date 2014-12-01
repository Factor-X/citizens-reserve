angular.module('app.directives', ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'ui-rangeSlider']);
angular.module('app.filters', []);
angular.module('app.services', []);
angular.module('app.controllers', ['app.services', 'ngRoute', 'ngLocale', 'gettext']);
angular.module('app', ['app.directives', 'app.filters', 'app.services', 'app.controllers']);
angular.module('app').run(function(gettextCatalog) {
  gettextCatalog.setCurrentLanguage('fr');
  return gettextCatalog.loadRemote("/translations");
});
angular.module('app.controllers').config(function($routeProvider) {
  $routeProvider.when('/household-profile', {
    templateUrl: '$/angular/views/household/profile/household-profile.html',
    controller: 'FormCtrl',
    resolve: {
      topic: function($route) {
        return $route.current.params.topic;
      }
    }
  }).when('/household-action', {
    templateUrl: '$/angular/views/household/action/household-action.html',
    controller: 'FormCtrl',
    resolve: {
      topic: function($route) {
        return $route.current.params.topic;
      }
    }
  }).when('/welcome', {
    templateUrl: '$/angular/views/welcome.html',
    controller: 'WelcomeCtrl'
  }).otherwise({
    redirectTo: '/welcome'
  });
  return;
});angular.module('app.services').service("surveyDTOService", function($rootScope, $modal) {
  this.surveyDTO = {
    account: {},
    answers: []
  };
  this.getAnswers = function(questionCode) {
    return _.where(this.surveyDTO.answers, {
      questionKey: questionCode
    });
  };
  this.getAccount = function() {
    return this.surveyDTO.account;
  };
  this.getAnswerValue = function(questionKey, periodKey) {
    var answer, answerValue;
    if (!!periodKey) {
      answer = _.findWhere(this.surveyDTO.answers, {
        questionKey: questionKey,
        periodKey: periodKey
      });
    } else {
      answer = _.findWhere(this.surveyDTO.answers, {
        questionKey: questionKey
      });
    }
    if (!answer) {
      answer = {
        questionKey: questionKey,
        periodKey: periodKey,
        answerValues: []
      };
      this.surveyDTO.answers.push(answer);
    }
    if (answer.answerValues.length === 0) {
      answerValue = {
        stringValue: null,
        doubleValue: null,
        booleanValue: null
      };
      answer.answerValues.push(answerValue);
    } else {
      answerValue = answer.answerValues[0];
    }
    return answerValue;
  };
  return;
});angular.module('app.services').service("generateId", function($rootScope) {
  this.generate = function() {
    var i, possible, text;
    text = "";
    possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    i = 0;
    while (i < 20) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
      i++;
    }
    return text;
  };
  return;
});angular.module('app.services').service("messageFlash", function() {
  this.display = function(type, message, opts) {
    var options;
    options = {
      message: message,
      type: type,
      hideAfter: 5,
      showCloseButton: true
    };
    return Messenger().post(angular.extend(options, angular.copy(opts)));
  };
  this.displaySuccess = function(message, opts) {
    return this.display('success', message, opts);
  };
  this.displayInfo = function(message, opts) {
    return this.display('info', message, opts);
  };
  this.displayError = function(message, opts) {
    return this.display('error', message, opts);
  };
  return;
});angular.module('app.services').service("directiveService", function($sce) {
  this.autoScope = function(s) {
    var k, res, v;
    res = {};
    for (k in s) {
      v = s[k];
      res[k] = v;
      if (k.slice(0, 2) === 'ng' && v === '=') {
        res[k[2].toLowerCase() + k.slice(3)] = '@';
      }
    }
    return res;
  };
  this.autoScopeImpl = function(s, name) {
    var fget, key, val;
    s.$$NAME = name;
    for (key in s) {
      val = s[key];
      if (key.slice(0, 2) === 'ng') {
        fget = function(scope, k) {
          return function() {
            var v;
            v = 0;
            if (scope[k] === void 0 || scope[k] === null || scope[k] === '') {
              v = scope[k[2].toLowerCase() + k.slice(3)];
            } else {
              v = scope[k];
            }
            if (scope['decorate' + k.slice(2)]) {
              return scope['decorate' + k.slice(2)](v);
            } else {
              return v;
            }
          };
        };
        s['get' + key.slice(2)] = fget(s, key);
      }
    }
    s.isTrue = function(v) {
      return v === true || v === 'true' || v === 'y';
    };
    s.isFalse = function(v) {
      return v === false || v === 'false' || v === 'n';
    };
    s.isNull = function(v) {
      return v === null;
    };
    return s.html = function(v) {
      return $sce.trustAsHtml(v);
    };
  };
  return;
});angular.module('app.services').service("downloadService", function($http, $q, messageFlash) {
  this.downloadsInProgress = 0;
  this.getDownloadsInProgress = function() {
    return this.downloadsInProgress;
  };
  this.getJson = function(url, callback) {
    var deferred, promise;
    console.log("GET URL TO " + url);
    deferred = $q.defer();
    this.downloadsInProgress++;
    promise = $http({
      method: "GET",
      url: url,
      headers: {
        "Content-Type": "application/json",
        "Pragma": "no-cache"
      }
    });
    promise.success(function(data, status, headers, config) {
      this.downloadsInProgress--;
      return deferred.resolve(callback({
        data: data,
        status: status,
        headers: headers,
        config: config,
        success: true
      }));
    });
    promise.error(function(data, status, headers, config) {
      this.downloadsInProgress--;
      if (!!data) {
        messageFlash.displayError(data);
      }
      return deferred.resolve(callback({
        data: data,
        status: status,
        headers: headers,
        config: config,
        success: false
      }));
    });
    return deferred.promise;
  };
  this.postJson = function(url, data, callback, options) {
    var deferred, promise;
    console.log("POST URL TO " + url);
    deferred = $q.defer();
    if (data === null) {
      data = {};
    }
    this.downloadsInProgress++;
    promise = $http({
      method: "POST",
      url: url,
      data: data,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json,application/octet-stream"
      }
    });
    promise.success(function(data, status, headers, config) {
      this.downloadsInProgress--;
      return deferred.resolve(callback({
        data: data,
        status: status,
        headers: headers,
        config: config,
        success: true
      }));
    });
    promise.error(function(data, status, headers, config) {
      this.downloadsInProgress--;
      if (!!data) {
        messageFlash.displayError(data);
      }
      return deferred.resolve(callback({
        data: data,
        status: status,
        headers: headers,
        config: config,
        success: false
      }));
    });
    return deferred.promise;
  };
  return;
});angular.module('app.services').service("modalService", function($rootScope, $modal) {
  this.open = function(parameters) {
    return $modal.open(parameters);
  };
  return;
});angular.module('app.services').service("conditionService", function(surveyDTOService) {
  var testBooleanAnswerEquals, testNumericValueGreaterThan, testStringAnswerValueNotEquals;
  testBooleanAnswerEquals = function(questionKey, periodKey, value) {
    var answerValue;
    answerValue = surveyDTOService.getAnswerValue(questionKey, periodKey).booleanValue;
    if (answerValue === null) {
      return false;
    }
    return answerValue === value;
  };
  testStringAnswerValueNotEquals = function(questionKey, periodKey, value) {
    var answerValue;
    answerValue = surveyDTOService.getAnswerValue(questionKey, periodKey).stringValue;
    if (answerValue === null) {
      return false;
    }
    return answerValue !== value;
  };
  testNumericValueGreaterThan = function(questionKey, periodKey, value) {
    var answerValue;
    answerValue = surveyDTOService.getAnswerValue(questionKey, periodKey).doubleValue;
    if (answerValue === null) {
      return false;
    }
    return answerValue > value;
  };
  this.checkCondition = function(questionKey) {
    if (questionKey === "Q3210") {
      return true;
    }
    if (questionKey === "Q3211") {
      return testBooleanAnswerEquals("Q3210", null, true);
    }
    if (questionKey === "Q3110") {
      return (testStringAnswerValueNotEquals("Q1110", "FIRST", "0") || testStringAnswerValueNotEquals("Q1110", "SECOND", "0") || testStringAnswerValueNotEquals("Q1110", "THIRD", "0")) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3120") {
      return (testStringAnswerValueNotEquals("Q1120", "FIRST", "0") || testStringAnswerValueNotEquals("Q1120", "SECOND", "0") || testStringAnswerValueNotEquals("Q1120", "THIRD", "0")) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3130") {
      return (testStringAnswerValueNotEquals("Q1130", "FIRST", "0") || testStringAnswerValueNotEquals("Q1130", "SECOND", "0") || testStringAnswerValueNotEquals("Q1130", "THIRD", "0")) && testStringAnswerValueNotEquals("Q3211", "4");
    }
    if (questionKey === "Q3310") {
      return testNumericValueGreaterThan("Q1600", 0) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3320") {
      return testNumericValueGreaterThan("Q1900", 0) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3330") {
      return testStringAnswerValueNotEquals("Q1210", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3410") {
      return testStringAnswerValueNotEquals("Q1220", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3420") {
      return testStringAnswerValueNotEquals("Q1230", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3510") {
      return testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3530") {
      return testNumericValueGreaterThan("Q1800", 0) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3610") {
      return testStringAnswerValueNotEquals("Q2010", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3620") {
      return testStringAnswerValueNotEquals("Q2020", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3630") {
      return testStringAnswerValueNotEquals("Q1700", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3631") {
      return testBooleanAnswerEquals("Q3630", null, true) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3640") {
      return (testStringAnswerValueNotEquals("Q1160", "FIRST", "0") || testStringAnswerValueNotEquals("Q1160", "SECOND", "0") || testStringAnswerValueNotEquals("Q1160", "THIRD", "0")) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3810") {
      return testStringAnswerValueNotEquals("Q1235", null, "0");
    }
    if (questionKey === "Q3710") {
      return (testStringAnswerValueNotEquals("Q1140", "FIRST", "0") || testStringAnswerValueNotEquals("Q1140", "SECOND", "0") || testStringAnswerValueNotEquals("Q1140", "THIRD", "0") || testStringAnswerValueNotEquals("Q1150", "FIRST", "0") || testStringAnswerValueNotEquals("Q1150", "SECOND", "0") || testStringAnswerValueNotEquals("Q1150", "THIRD", "0") || testStringAnswerValueNotEquals("Q2030", null, "0") || testStringAnswerValueNotEquals("Q2040", null, "0")) && testStringAnswerValueNotEquals("Q3211", null, "4");
    }
    if (questionKey === "Q3711") {
      return testBooleanAnswerEquals("Q3710", null, true);
    }
    if (questionKey === "Q3720") {
      return (testStringAnswerValueNotEquals("Q1140", "FIRST", "0") || testStringAnswerValueNotEquals("Q1140", "SECOND", "0") || testStringAnswerValueNotEquals("Q1140", "THIRD", "0")) && testStringAnswerValueNotEquals("Q3211", null, "4") && testStringAnswerValueNotEquals("Q3711", null, "4");
    }
    if (questionKey === "Q3730") {
      return (testStringAnswerValueNotEquals("Q1150", "FIRST", "0") || testStringAnswerValueNotEquals("Q1150", "SECOND", "0") || testStringAnswerValueNotEquals("Q1150", "THIRD", "0")) && testStringAnswerValueNotEquals("Q3211", null, "4") && testStringAnswerValueNotEquals("Q3711", null, "4");
    }
    if (questionKey === "Q3750") {
      return testStringAnswerValueNotEquals("Q2030", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4") && testStringAnswerValueNotEquals("Q3711", null, "4");
    }
    if (questionKey === "Q3760") {
      return testStringAnswerValueNotEquals("Q2040", null, "0") && testStringAnswerValueNotEquals("Q3211", null, "4") && testStringAnswerValueNotEquals("Q3711", null, "4");
    }
    if (questionKey === "Q3740") {
      return testStringAnswerValueNotEquals("Q3211", null, "4") && testStringAnswerValueNotEquals("Q3711", null, "4");
    }
    if (questionKey === "Q3741") {
      return testStringAnswerValueNotEquals("Q3740", null, "0");
    }
  };
  return;
});angular.module('app.services').service("optionService", function($rootScope, $modal, gettextCatalog, $filter) {
  var cleanKey, options;
  options = {};
  this.getNumericOptions = function(questionKey, min, max, step) {
    var element, maxF, minF, optionList, stepF, _i, _len, _ref;
    if (options[questionKey] != null) {
      return options[questionKey];
    }
    optionList = [
      {
        value: null,
        label: null
      }
    ];
    minF = parseFloat(min);
    maxF = parseFloat(max) + parseFloat(step);
    stepF = parseFloat(step);
    _ref = _.range(minF, maxF, stepF);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      optionList.push({
        value: element + "",
        label: element + ""
      });
    }
    options[questionKey] = optionList;
    return optionList;
  };
  this.getOptions = function(questionKey) {
    var list, opt, optionList, pattern, _i, _len;
    if (options[questionKey] != null) {
      return options[questionKey];
    }
    pattern = new RegExp(questionKey + "\.options\.*");
    list = _.filter(Object.keys(gettextCatalog.strings.fr), function(key) {
      return pattern.test(key);
    });
    list.sort();
    optionList = [
      {
        value: null,
        label: null
      }
    ];
    for (_i = 0, _len = list.length; _i < _len; _i++) {
      opt = list[_i];
      optionList.push({
        value: cleanKey(questionKey, opt),
        label: $filter('translate')(opt)
      });
    }
    options[questionKey] = optionList;
    return optionList;
  };
  cleanKey = function(questionKey, key) {
    var match, pattern;
    pattern = new RegExp(questionKey + "\.options\.([^\.]+)\.label");
    match = pattern.exec(key);
    return match[1];
  };
  return;
});angular.module('app.filters').filter("toWatts", function(translateFilter) {
  return function(input) {
    if (input != null) {
      return input + translateFilter('filter.toWatts.w.suffix');
    }
  };
});angular.module('app.filters').filter("toSquareMeters", function(translateFilter) {
  return function(input) {
    if (input != null) {
      return input + translateFilter('filter.toSquareMeters.m2.suffix');
    }
  };
});angular.module('app.filters').filter("toHour", function(translateFilter) {
  return function(input) {
    if (input != null) {
      return input + translateFilter('filter.toHour.hour.suffix');
    }
  };
});angular.module('app.filters').filter("numberToI18N", function($filter) {
  return function(input, nbDecimal) {
    if (nbDecimal == null) {
      nbDecimal = 2;
    }
    if (input != null) {
      return $filter("number")(parseFloat(input), nbDecimal);
    }
    return "";
  };
});angular.module('app.filters').filter("stringToFloat", function() {
  return function(input) {
    if (input != null) {
      return parseFloat(input);
    }
  };
});angular.module('app.directives').directive("crQuestion", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngLabel: '=',
      ngInline: '='
    }),
    templateUrl: "$/angular/templates/cr-question.html",
    replace: false,
    transclude: true,
    link: function(scope, elem, attrs, ngModel) {
      return directiveService.autoScopeImpl(scope);
    }
  };
});angular.module('app.directives').directive("crDropdown", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngOptions: '=',
      ngModel: '=',
      ngDisabled: '=',
      ngOpened: '='
    }),
    templateUrl: "$/angular/templates/cr-dropdown.html",
    replace: true,
    link: function(scope) {
      directiveService.autoScopeImpl(scope);
      scope.$select = function(o) {
        return scope.ngModel = o;
      };
      return scope.$opened = function() {
        console.log('ok');
        return !!scope.getOpened();
      };
    }
  };
});angular.module('app.directives').directive("crConditionned", function(conditionService, surveyDTOService) {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      var handler, result;
      console.log(attrs.crConditionned);
      result = conditionService.checkCondition(attrs.crConditionned);
      if (result) {
        $(element).show();
      } else {
        $(element).hide();
      }
      handler = function() {
        result = conditionService.checkCondition(attrs.crConditionned);
        console.log("model changed!! result = ", result);
        if (result) {
          $(element).slideDown();
        } else {
          $(element).slideUp();
        }
        return;
      };
      scope.$watch((function() {
        return surveyDTOService.surveyDTO;
      }), handler, true);
      return;
    }
  };
});angular.module('app.directives').directive("crRadio", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngModel: '=',
      ngOptions: '=',
      ngFreeAllowed: '='
    }),
    templateUrl: "$/angular/templates/cr-radio.html",
    replace: true,
    link: function(scope, elem, attrs, ngModel) {
      directiveService.autoScopeImpl(scope);
      scope.setValue = function(v) {
        return scope.ngModel = v;
      };
      scope.isValue = function(v) {
        return scope.ngModel == v;
      };
      scope.$watch('ngOptions', function(n, o) {
        var element, _i, _len, _results;
        scope.computedOptions = [];
        _results = [];
        for (_i = 0, _len = n.length; _i < _len; _i++) {
          element = n[_i];
          _results.push(typeof element === 'object' ? scope.computedOptions.push(element) : scope.computedOptions.push({
            value: element,
            label: element
          }));
        }
        return _results;
      });
      return scope.toggle = function() {
        var o, _i, _len, _ref;
        scope.edit = !scope.edit;
        if (!scope.edit) {
          if (scope.ngOptions.length > 0) {
            _ref = scope.ngOptions;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              o = _ref[_i];
              if (o.value == scope.ngModel) {
                return;
              }
            }
            return scope.ngModel = scope.ngOptions[0].value;
          }
        }
      };
    }
  };
});angular.module('app.directives').directive("crSection", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngLabel: '='
    }),
    templateUrl: "$/angular/templates/cr-section.html",
    replace: false,
    transclude: true,
    link: function(scope, elem, attrs, ngModel) {
      return directiveService.autoScopeImpl(scope);
    }
  };
});angular.module('app.directives').directive("crNumber", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngModel: '='
    }),
    require: 'ngModel',
    templateUrl: "$/angular/templates/cr-number.html",
    replace: true,
    link: function(scope, elem, attrs, ngModel) {
      directiveService.autoScopeImpl(scope);
      ngModel.$parsers.push(function(inputValue) {
        var firstParse, max, min, n, prepParse, returnValue, safeParse, secondParse, transformedInput;
        if (inputValue == null) {
          return "";
        }
        firstParse = inputValue.replace(/[^0-9 . -]/g, "");
        safeParse = firstParse.charAt(0);
        prepParse = firstParse.substring(1, firstParse.length);
        secondParse = safeParse + prepParse.replace(/[^0-9 .]/g, "");
        n = secondParse.indexOf(".");
        transformedInput = void 0;
        if (n === -1) {
          transformedInput = secondParse;
        } else {
          safeParse = secondParse.substring(0, n + 1);
          firstParse = (secondParse.substring(n + 1, secondParse.length)).replace(/[^0-9]/g, "");
          n = 2;
          if (firstParse.length <= n) {
            transformedInput = safeParse + firstParse;
          } else {
            transformedInput = safeParse + firstParse.substring(0, n);
          }
        }
        min = parseInt(attrs.minvalue);
        max = parseInt(attrs.maxvalue);
        if (transformedInput !== inputValue || transformedInput < min || transformedInput > max) {
          returnValue = void 0;
          if (transformedInput < min || transformedInput > max) {
            returnValue = transformedInput.substring(0, transformedInput.length - 1);
          } else {
            returnValue = transformedInput;
          }
          ngModel.$setViewValue(returnValue);
          ngModel.$render();
        }
        returnValue;
        return;
      });
      ngModel.$formatters.push(function(value) {
        return 0 + parseInt(value);
      });
      scope.g = function() {
        return typeof scope.ngModel;
      };
      return scope;
    }
  };
});angular.module('app.directives').directive("crDoubleRange", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngRangeMin: '=',
      ngRangeMax: '=',
      ngMin: '=',
      ngMax: '=',
      ngDisabled: '='
    }),
    templateUrl: "$/angular/templates/cr-double-range.html",
    replace: true,
    link: function(scope, elem, attrs, ngModel) {
      return directiveService.autoScopeImpl(scope);
    }
  };
});angular.module('app.directives').directive("crText", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngModel: '=',
      ngMultiline: '=',
      ngType: '=',
      ngName: '='
    }),
    require: 'ngModel',
    templateUrl: "$/angular/templates/cr-text.html",
    replace: true,
    link: function(scope, elem, attrs, ngModel) {
      directiveService.autoScopeImpl(scope);
      if (scope.getType()) {
        return $('input', elem).attr('type', scope.getType());
      }
    }
  };
});angular.module('app.directives').directive("crSlider", function(directiveService, $filter) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngModel: '=',
      ngSteps: '=',
      ngFreeAllowed: '=',
      ngMin: '=',
      ngMax: '=',
      ngStep: '=',
      ngVisible: '=',
      ngVertical: '=',
      ngFilter: '=',
      ngTheme: '='
    }),
    templateUrl: "$/angular/templates/cr-slider.html",
    replace: false,
    link: function(scope, elem, attrs, ngModel) {
      directiveService.autoScopeImpl(scope);
      scope.labelFilter = $filter('translate');
      scope.opened = false;
      scope.computedOptionsFiltered = [
        {
          label: null,
          value: null
        }
      ];
      scope.setValue = function(v) {
        if (v.value === null) {
          scope.ngModel = null;
          scope.expanded = false;
          return scope.updateComputedOptionsFiltered();
        } else if (scope.getVertical() && scope.computedOptions.length > 3 && !scope.expanded) {
          scope.expanded = true;
          return scope.updateComputedOptionsFiltered();
        } else {
          scope.ngModel = v.value;
          return scope.expanded = false;
        }
      };
      scope.isValue = function(v) {
        var indexOfNgModel, indexOfV, o, _i, _j, _len, _len2, _ref, _ref2;
        return scope.ngModel === v.value;
        indexOfNgModel = -1;
        _ref = scope.computedOptions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          if (o.value == scope.ngModel) {
            break;
          } else {
            indexOfNgModel++;
          }
        }
        indexOfV = -1;
        _ref2 = scope.computedOptions;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          o = _ref2[_j];
          if (o.value == v.value) {
            break;
          } else {
            indexOfV++;
          }
        }
        if (indexOfNgModel === -1 || indexOfV === -1) {
          return false;
        } else {
          return indexOfV <= indexOfNgModel;
        }
      };
      scope.isVisible = function() {
        var v;
        v = scope.ngVisible;
        if (v === void 0) {
          return true;
        } else if (v === null) {
          return false;
        } else {
          return !!v;
        }
      };
      scope.$watch(['ngFilter', 'filter'], function() {
        var n;
        n = scope.getFilter();
        if (n) {
          return scope.labelFilter = $filter(n);
        } else {
          return scope.labelFilter = $filter('translate');
        }
      });
      scope.$watch(['ngSteps', 'ngMax', 'ngMin', 'ngStep', 'max', 'min', 'step'], function(n, o) {
        var element, max, min, step, _i, _j, _len, _len2, _ref, _ref2;
        scope.computedOptions = [];
        if (scope.ngSteps) {
          _ref = scope.ngSteps;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            element = _ref[_i];
            if (element === null) {
              scope.computedOptions.push({
                value: element,
                label: element
              });
            } else if (typeof element === 'object') {
              scope.computedOptions.push(element);
            } else {
              scope.computedOptions.push({
                value: element,
                label: element
              });
            }
          }
        } else if (scope.getMin() !== void 0 && scope.getMax() !== void 0 && scope.getStep() !== void 0) {
          scope.computedOptions.push({
            value: null,
            label: null
          });
          min = parseFloat(scope.getMin());
          max = parseFloat(scope.getMax()) + parseFloat(scope.getStep());
          step = parseFloat(scope.getStep());
          _ref2 = _.range(min, max, step);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            element = _ref2[_j];
            scope.computedOptions.push({
              value: element,
              label: element
            });
          }
        }
        if (scope.getVertical()) {
          return scope.updateComputedOptionsFiltered();
        }
      });
      scope.$watch('ngModel', function() {
        return scope.updateComputedOptionsFiltered();
      });
      scope.updateComputedOptionsFiltered = function() {
        if (scope.expanded) {
          return scope.computedOptionsFiltered = scope.computedOptions;
        } else {
          scope.computedOptionsFiltered = _.where(scope.computedOptions, {
            value: scope.ngModel
          });
          if (_.where(scope.computedOptionsFiltered, {
            value: null
          }).length === 0) {
            scope.computedOptionsFiltered.unshift({
              label: null,
              value: null
            });
          }
          return scope.computedOptionsFiltered.push({
            value: "$SELECT_A_VALUE$",
            label: null
          });
        }
      };
      scope.toggleExpanded = function() {
        scope.expanded = !scope.expanded;
        return scope.updateComputedOptionsFiltered();
      };
      $(elem).mouseenter(function() {
        var $scroller;
        $scroller = $(".cr-slider-not-null-box", this);
        return $scroller.stop(true);
      });
      return $(elem).mouseleave(function() {
        var $scroller, cnt, idx, o, offset, target, w, _i, _len, _ref;
        $scroller = $(".cr-slider-not-null-box", this);
        w = $scroller[0].scrollWidth;
        idx = -1;
        _ref = scope.computedOptions;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          if (o.value == scope.ngModel) {
            break;
          }
          idx++;
        }
        cnt = scope.computedOptions.length - 1;
        offset = 1.0 * idx / cnt;
        target = w * offset - $scroller.width() / 2;
        if (target < 0) {
          target = 0;
        }
        if (target > w - $scroller.width() / 2 - 50) {
          target = w - $scroller.width() / 2 - 50;
        }
        if (Math.abs(target - $scroller.scrollLeft()) > 1) {
          return $scroller.delay(1000).animate({
            scrollLeft: target
          }, {
            easing: 'easeInOutBack'
          });
        }
      });
    }
  };
});angular.module('app.directives').directive("crBoolean", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngModel: '='
    }),
    templateUrl: "$/angular/templates/cr-boolean.html",
    replace: false,
    link: function(scope, elem, attrs, ngModel) {
      directiveService.autoScopeImpl(scope);
      return scope.steps = [
        {
          value: null,
          label: null
        }, {
          value: true,
          label: "directive.boolean.yes"
        }, {
          value: false,
          label: "directive.boolean.no"
        }
      ];
    }
  };
});angular.module('app.directives').directive("crTopic", function(directiveService, modalService, $log) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngActive: '=',
      ngImage: '=',
      ngView: '=',
      ngController: '=',
      ngWindowClass: '=',
      ngLabel: '='
    }),
    templateUrl: "$/angular/templates/cr-topic.html",
    replace: true,
    link: function(scope, elem, attrs, ngModel) {
      directiveService.autoScopeImpl(scope);
      return scope.open = function() {
        var modalInstance;
        console.log(scope.getWindowClass());
        modalInstance = modalService.open({
          templateUrl: scope.getView(),
          controller: scope.getController(),
          size: 'lg',
          windowClass: scope.getWindowClass(),
          resolve: {}
        });
        return modalInstance.result.then(function(result) {
          return $log.info(result);
        }, function() {
          return $log.info('Modal dismissed at: ' + new Date());
        });
      };
    }
  };
});angular.module('app.directives').directive("ngEnter", function() {
  return function(scope, element, attrs) {
    return element.bind("keydown keypress", function(event) {
      if (event.which === 13) {
        scope.$apply(function() {
          return scope.$eval(attrs.ngEnter);
        });
        return event.preventDefault();
      }
    });
  };
});angular.module('app.directives').directive("mmFieldDate", function(directiveService, $filter, generateId) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngInfo: '='
    }),
    templateUrl: "$/angular/templates/mm-field-date.html",
    replace: true,
    transclude: true,
    compile: function() {
      return {
        pre: function(scope) {
          scope.id = generateId.generate();
          return scope.idHtag = '#' + scope.id;
        },
        post: function(scope) {
          directiveService.autoScopeImpl(scope);
          scope.result = null;
          scope.$watch('result', function() {
            return scope.resultFormated = $filter('date')(scope.result, 'yyyy-MM-dd');
          });
          scope.$watch('getInfo().field', function() {
            if (scope.getInfo().field != null) {
              return scope.result = new Date(Number(scope.getInfo().field));
            }
          });
          scope.$watch('result', function() {
            if (scope.result != null) {
              scope.getInfo().field = scope.result.getTime();
            } else {
              scope.getInfo().field = null;
            }
            return scope.isValid();
          });
          scope.isValid = function() {
            var isValid;
            if (scope.getInfo().disabled === true || scope.getInfo().hidden === true) {
              scope.getInfo().isValid = true;
              return;
            }
            isValid = true;
            if (!(scope.getInfo().field != null)) {
              isValid = false;
            }
            scope.getInfo().isValid = isValid;
            return;
          };
          scope.isValid();
          return scope.logField = function() {
            return console.log(scope.getInfo());
          };
        }
      };
    }
  };
});angular.module('app.directives').directive("focusMe", function($timeout, $parse) {
  return {
    restrict: 'A',
    scope: {
      focusMe: '='
    },
    link: function(scope, element, attrs) {
      scope.$watch('focusMe', function() {
        if (scope.focusMe === true) {
          return element[0].focus();
        }
      });
      return;
    }
  };
});angular.module('app.directives').directive("mmFieldText", function(directiveService, $timeout) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngInfo: '='
    }),
    templateUrl: "$/angular/templates/mm-field-text.html",
    replace: true,
    transclude: true,
    compile: function() {
      return {
        pre: function(scope) {
          return directiveService.autoScopeImpl(scope);
        },
        post: function(scope) {
          directiveService.autoScopeImpl(scope);
          scope.isValidationDefined = (scope.getInfo().validationRegex != null) || (scope.getInfo().validationFct != null);
          scope.hideIsValidIcon = !!scope.getInfo().hideIsValidIcon;
          scope.fieldType = (scope.getInfo().fieldType != null) ? scope.getInfo().fieldType : "text";
          if (!(scope.getInfo().field != null)) {
            scope.getInfo().field = "";
          }
          if (!(scope.getInfo().isValid != null)) {
            scope.getInfo().isValid = !scope.isValidationDefined;
          }
          if (scope.isValidationDefined) {
            scope.$watch('getInfo().field', function(n, o) {
              if (n !== o) {
                return scope.isValid();
              }
            });
          }
          scope.isValid = function() {
            var isValid;
            if (scope.getInfo().disabled === true || scope.getInfo().hidden === true) {
              scope.getInfo().isValid = true;
              return;
            }
            if (!scope.getInfo().field) {
              scope.getInfo().field = "";
            }
            /*
            scope.getInfo().isValid = false
            return
            */
            isValid = true;
            if (typeof scope.getInfo().field !== 'string') {
              scope.getInfo().field += "";
            }
            if (scope.getInfo().validationRegex != null) {
              isValid = scope.getInfo().field.match(scope.getInfo().validationRegex);
            }
            if (scope.getInfo().validationFct != null) {
              isValid = isValid && scope.getInfo().validationFct();
            }
            scope.getInfo().isValid = isValid;
            return;
          };
          scope.isValid();
          scope.logField = function() {
            return console.log(scope.getInfo());
          };
          scope.errorMessage = "";
          return scope.setErrorMessage = function(errorMessage) {
            scope.errorMessage = errorMessage;
            if (scope.lastTimeOut != null) {
              $timeout.cancel(scope.lastTimeOut);
            }
            return scope.lastTimeOut = $timeout(function() {
              scope.errorMessage = "";
              return scope.lastTimeOut = null;
            }, 2000);
          };
        }
      };
    }
  };
});angular.module('app.directives').directive("mmFieldAutoCompletion", function(directiveService) {
  return {
    restrict: "E",
    scope: directiveService.autoScope({
      ngInfo: '='
    }),
    templateUrl: "$/angular/templates/mm-field-auto-completion.html",
    replace: true,
    transclude: true,
    link: function(scope) {
      directiveService.autoScopeImpl(scope);
      scope.result = null;
      scope.$watch('result', function() {
        if (scope.result != null) {
          scope.getInfo().field = scope.result.originalObject.key;
        } else {
          scope.getInfo().field = null;
        }
        return scope.isValid();
      });
      scope.isValid = function() {
        var isValid;
        if (scope.getInfo().disabled === true || scope.getInfo().hidden === true) {
          scope.getInfo().isValid = true;
          return;
        }
        isValid = true;
        if (!(scope.getInfo().field != null)) {
          isValid = false;
        }
        scope.getInfo().isValid = isValid;
        return;
      };
      scope.isValid();
      return scope.logField = function() {
        return console.log(scope.getInfo());
      };
    }
  };
});angular.module('app.directives').directive("numbersOnly", function($filter, $locale) {
  return {
    restrict: 'A',
    require: "ngModel",
    link: function(scope, element, attrs, modelCtrl) {
      var convertToFloat, convertToString, displayError, errorMessage, filterFloat, nbDecimal;
      if (attrs.numbersOnly === "integer" || attrs.numbersOnly === "double") {
        if (attrs.numbersOnly === "integer") {
          errorMessage = 'Only integer';
        } else {
          errorMessage = 'Only number';
        }
        nbDecimal = 3;
        if (attrs.numbersOnly === "integer") {
          nbDecimal = 0;
        }
        scope.$root.$on('$localeChangeSuccess', function(event, current, previous) {
          var result;
          if (modelCtrl.$modelValue != null) {
            result = convertToString(parseFloat(modelCtrl.$modelValue));
            if (result != null) {
              modelCtrl.$setViewValue(result.toString());
              return modelCtrl.$render();
            }
          }
        });
        modelCtrl.$parsers.unshift(function(viewValue) {
          var result, resultString, resultToDisplay;
          if (viewValue === "") {
            return null;
          }
          result = convertToFloat(viewValue);
          if (isNaN(result)) {
            displayError();
            if (scope.lastValidValue != null) {
              resultString = scope.lastValidValue.toString();
              if (attrs.numbersOnly === "percent") {
                resultToDisplay = (scope.lastValidValue * 100).toString();
              } else {
                resultToDisplay = scope.lastValidValue.toString();
              }
            } else {
              resultString = "";
              resultToDisplay = "";
            }
            modelCtrl.$setViewValue(resultToDisplay);
            modelCtrl.$render();
          } else {
            if (attrs.numbersOnly === "percent") {
              result = result / 100;
            }
            scope.lastValidValue = result;
            resultString = result.toString();
          }
          if (resultString === "") {
            return null;
          }
          return resultString;
        });
        modelCtrl.$formatters.unshift(function(modelValue) {
          var result;
          result = parseFloat(modelValue);
          if (attrs.numbersOnly === "percent") {
            result = result * 100;
          }
          return convertToString(result);
        });
        displayError = function() {
          if (scope.setErrorMessage != null) {
            return scope.setErrorMessage(errorMessage);
          }
        };
        convertToString = function(value) {
          var formats, result;
          if (!(value != null) || isNaN(value)) {
            return "";
          }
          value = value.toFixed(nbDecimal);
          formats = $locale.NUMBER_FORMATS;
          return result = value.toString().replace(new RegExp("\\.", "g"), formats.DECIMAL_SEP);
        };
        convertToFloat = function(viewValue) {
          var decimalRegex, formats, value;
          if (viewValue === "") {
            return NaN;
          }
          formats = $locale.NUMBER_FORMATS;
          decimalRegex = formats.DECIMAL_SEP;
          if (decimalRegex === ".") {
            decimalRegex = "\\.";
          }
          value = viewValue.replace(new RegExp(decimalRegex, "g"), ".");
          return filterFloat(value);
        };
        filterFloat = function(value) {
          var regexFloat;
          if (attrs.numbersOnly === "integer") {
            regexFloat = new RegExp("^(\\-|\\+)?([0-9]+|Infinity)$");
          } else {
            regexFloat = new RegExp("^(\\-|\\+)?([0-9]+(\\.[0-9]*)?|Infinity)$");
          }
          if (regexFloat.test(value)) {
            return Number(value);
          }
          return NaN;
        };
        return scope.$root.$on('FORM_LOADING_FINISH', function(event, current, previous) {
          if (modelCtrl.$modelValue != null) {
            return scope.lastValidValue = modelCtrl.$modelValue;
          }
        });
      }
    }
  };
});angular.module('app.directives').directive("ngEscape", function() {
  return function(scope, element, attrs) {
    return element.bind("keydown keypress", function(event) {
      if (event.which === 27) {
        scope.$apply(function() {
          return scope.$eval(attrs.ngEscape);
        });
        return event.preventDefault();
      }
    });
  };
});angular.module('app.controllers').controller("MainCtrl", function($scope, modalService, $log, gettextCatalog) {
  $scope.setLanguage = function(lang) {
    return gettextCatalog.setCurrentLanguage(lang);
  };
  $scope.x = {
    sel: 'Human',
    items: ['Human', 'Bat', '-', 'Vampire'],
    cnt: 10,
    firstName: 'Winston',
    password: '123',
    comment: 'Attitude is a little thing that makes a big difference.',
    doubleRange: {
      min: 2,
      max: 3,
      rangeMin: 0,
      rangeMax: 5
    },
    radio: {
      value: null,
      options: [
        {
          value: 0,
          label: 'OPT_0'
        }, {
          value: 1,
          label: 'OPT_1'
        }, {
          value: 2,
          label: 'OPT_2'
        }, {
          value: 3,
          label: 'OPT_3'
        }, {
          value: 4,
          label: 'OPT_4'
        }
      ],
      simpleOptions: [0, 1, 2, 3, 4]
    },
    slider: {
      value: null,
      steps: [
        {
          value: null,
          label: null
        }, {
          value: 18,
          label: '18h'
        }, {
          value: 19,
          label: '19h'
        }, {
          value: 20,
          label: '20h'
        }, {
          value: 21,
          label: '21h'
        }, {
          value: 22,
          label: '22h'
        }
      ],
      simpleSteps: [null, 18, 19, 20, 21, 22]
    },
    continuousSlider: {
      value: 100,
      step: 10,
      min: 20,
      max: 2000
    },
    yesno: {
      value: null
    },
    grid: [
      {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?2165438536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216548536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216438536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216543836158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216543853615851968161'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/128/512?3216543853615519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3215438536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216543853615851981651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216548536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216543536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/800?3165438536158519681651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3216543853615851981651'
      }, {
        title: 'AAA',
        content: 'Hello world',
        image: 'http://placekitten.com/512/512?3215438536158519681651'
      }
    ]
  };
  return $scope.$watch('x.sel', function(n, o) {
    var modalInstance;
    if (n === $scope.x.items[3]) {
      modalInstance = modalService.open({
        templateUrl: '$/angular/views/test/modal-confirm-vampire.html',
        controller: 'NiceModalCtrl',
        size: 'sm',
        resolve: {
          chosenValue: function() {
            return $scope.x.sel;
          }
        }
      });
      return modalInstance.result.then(function(result) {
        return $log.info(result);
      }, function() {
        $scope.x.sel = o;
        return $log.info('Modal dismissed at: ' + new Date());
      });
    }
  });
});
angular.module('app').run(function($rootScope, $location) {
  return $rootScope.redirectTo = function(target) {
    return $location.path(target);
  };
});angular.module('app.controllers').controller("LoginModalCtrl", function($scope, $modalInstance, downloadService, surveyDTOService) {
  $scope.o = {
    email: "",
    password: ""
  };
  $scope.valid = function() {
    var dto;
    dto = {
      email: $scope.o.email,
      password: $scope.o.password
    };
    return downloadService.postJson('/login', dto, function(result) {
      if (result.success) {
        surveyDTOService.surveyDTO = result.data;
        return $scope.close();
      }
    });
  };
  return $scope.close = function() {
    return $modalInstance.close();
  };
});angular.module('app.controllers').controller("FormCtrl", function($scope, modalService, $log, topic, downloadService, surveyDTOService, conditionService) {
  $scope.topic = topic;
  $scope.save = function() {
    console.log("surveyDTO");
    console.log(surveyDTOService.surveyDTO);
    return downloadService.postJson('/registration', surveyDTOService.surveyDTO, function(result) {
      if (result.success) {
        return console.log("je suis un success");
      } else {
        return console.log("je suis un echec");
      }
    });
  };
  $scope.load = function() {
    var modalInstance;
    return modalInstance = modalService.open({
      templateUrl: '$/angular/views/login_modal.html',
      controller: 'LoginModalCtrl'
    });
  };
  $scope.openModal = function(target) {
    var modalInstance;
    return modalInstance = modalService.open({
      templateUrl: '$/angular/views/' + target + '.html',
      controller: 'ModalTopicCtrl',
      size: 'lg'
    });
  };
  return $scope.hasAtLeastOneValidCondition = function(questionKeys) {
    var questionKey, _i, _len;
    for (_i = 0, _len = questionKeys.length; _i < _len; _i++) {
      questionKey = questionKeys[_i];
      if (conditionService.checkCondition(questionKey)) {
        return true;
      }
    }
    return false;
  };
});angular.module('app.controllers').controller("NiceModalCtrl", function($scope, $modalInstance, chosenValue) {
  $scope.selected = chosenValue;
  $scope.ok = function() {
    return $modalInstance.close($scope.selected);
  };
  return $scope.cancel = function() {
    return $modalInstance.dismiss('cancel');
  };
});angular.module('app.controllers').controller("WelcomeCtrl", function($scope, modalService, $log, $location, surveyDTOService) {
  return $scope.toHouseHold = function() {
    surveyDTOService.getAccount().accoutType = 'household';
    return $scope.$root.redirectTo('/household-profile');
  };
});angular.module('app.controllers').controller("ModalTopicCtrl", function($scope, surveyDTOService, optionService, $modalInstance) {
  $scope.getOptions = function(questionKey) {
    return optionService.getOptions(questionKey);
  };
  $scope.getNumericOptions = function(questionKey, min, max, step) {
    return optionService.getNumericOptions(questionKey, min, max, step);
  };
  $scope.getAnswerValue = function(questionKey, periodKey) {
    return surveyDTOService.getAnswerValue(questionKey, periodKey);
  };
  $scope.getAccount = function() {
    return surveyDTOService.getAccount();
  };
  return $scope.close = function() {
    return $modalInstance.close();
  };
});angular.module('app.directives').run(function($templateCache) {$templateCache.put('$/angular/views/welcome.html', "<div class=\"cr-welcome\">\n\n    <div class=\"container\">\n        <div class=\"row\">\n\n            <div class=\"col-md-12\">\n\n                <h1 ng-bind-html=\"'welcome.title' | translate\"></h1>\n\n            </div>\n        </div>\n\n        <div class=\"row\">\n\n            <div class=\"col-md-12\">\n                <h2 ng-bind-html=\"'welcome.choose_message' | translate\"></h2>\n            </div>\n        </div>\n\n        <div class=\"row\">\n\n            <div class=\"col-md-12\">\n                <button ng-bind-html=\"'generic.household' | translate\"\n                        ng-click=\"toHouseHold()\"></button>\n            </div>\n        </div>\n\n        <div class=\"row\">\n\n            <div class=\"col-md-12\">\n                <button ng-bind-html=\"'generic.enterprise' | translate\"\n                        ng-click=\"alert('not implemented yet !')\"></button>\n            </div>\n        </div>\n    </div>\n\n</div>");$templateCache.put('$/angular/views/test/modal-confirm-vampire.html', "<div class=\"modal-header\">\n    <h3 class=\"modal-title\">Vampire</h3>\n</div>\n<div class=\"modal-body\">\n    Are you sure to be a <b>{{ selected }}</b> ?!\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"ok()\">Yes</button>\n    <button class=\"btn btn-warning\" ng-click=\"cancel()\">No</button>\n</div>");$templateCache.put('$/angular/views/household/account/registration.html', "<div class=\"modal-header\">\n    <h3 class=\"modal-title\" ng-bind-html=\"'account.personaldata.title' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <!-- Q5110 generic.firstName -->\n    <cr-question label=\"generic.firstName\">\n        <cr-text ng-model=\"getAccount().firstName\" ></cr-text>\n    </cr-question>\n\n    <!-- Q5120 generic.lastName -->\n    <cr-question label=\"generic.lastName\">\n        <cr-text ng-model=\"getAccount().lastName\" ></cr-text>\n    </cr-question>\n\n    <!-- Q5130 generic.emailAddress -->\n    <cr-question label=\"generic.emailAddress\">\n        <cr-text ng-model=\"getAccount().email\" ></cr-text>\n    </cr-question>\n\n    <!-- Q5140 generic.password -->\n    <cr-question label=\"generic.password\">\n        <cr-text ng-model=\"getAccount().password\" ></cr-text>\n    </cr-question>\n\n    <!-- Q5150 generic.zip -->\n    <cr-question label=\"generic.zip\">\n        <cr-text ng-model=\"getAccount().zipCode\" ></cr-text>\n    </cr-question>\n\n    <!-- Q5210 account.powerprovider.label -->\n    <cr-question label=\"account.powerprovider.label\">\n        <cr-slider ng-steps=\"getOptions('Q5210')\" ng-model=\"getAccount().powerProvider\" vertical=\"true\"></cr-slider>\n    </cr-question>\n\n    <!-- Q5220 account.powerconsumercategory.labe -->\n    <cr-question label=\"account.powerconsumercategory.label\">\n        <cr-slider ng-steps=\"getOptions('powerconsumercategory')\" ng-model=\"getAccount().powerComsumerCategory\" vertical=\"true\"></cr-slider>\n    </cr-question>\n\n    <!--Q5310  account.otheremails.label DTO : otherEmailAddresses -->\n\n    <!-- Q5410 account.powerconsumercategory.labe -->\n    <cr-question label=\"account.info.summaryemail.label\">\n        <cr-slider ng-steps=\"getOptions('sensitizationkit')\" ng-model=\"getAccount().sensitizationKit\" vertical=\"true\"></cr-slider>\n    </cr-question>\n\n    <!-- advertisemnt -->\n    <p ng-bind-html=\"'account.info.summaryemail.label' | translate\"></p>\n\n\n    <p ng-bind-html=\"'account.info.terms&conditions.label' | translate\"></p>\n\n</div>\n<div class=\"modal-footer\">\n</div>");$templateCache.put('$/angular/views/household/profile/household-profile.html', "<div class=\"col-md-12\">\n    <h1>Ménage : Profil de consommation</h1>\n\n\n    <button class=\"col-md-2\"\n            ng-click=\"load()\"> Login\n    </button>\n\n\n    <div class=\"container\">\n        <div class=\"row\">\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                    image=\"household/topics/topic02\"\n                    view=\"$/angular/views/household/profile/topics/t01-presence.html\"\n                    controller=\"ModalTopicCtrl\"\n                    window-class=\"cr-theme-green\"\n                    label=\"topic.presence.label\"\n                    ></cr-topic>\n            </div>\n\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                    image=\"household/topics/topic01\"\n                    view=\"$/angular/views/household/profile/topics/t02-programs.html\"\n                    controller=\"ModalTopicCtrl\"\n                    window-class=\"cr-theme-blue\"\n                    label=\"topic.programs.label\"\n                    ></cr-topic>\n            </div>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                    image=\"household/topics/topic03\"\n                    view=\"$/angular/views/household/profile/topics/t03-heating.html\"\n                    controller=\"ModalTopicCtrl\"\n                    window-class=\"cr-theme-orange\"\n                    label=\"topic.heat.label\"\n                    ></cr-topic>\n            </div>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                    active=\"true\"\n                    image=\"household/topics/topic04\"\n                    view=\"$/angular/views/household/profile/topics/t04-lighting.html\"\n                    controller=\"ModalTopicCtrl\"\n                    window-class=\"cr-theme-red\"\n                    label=\"topic.light.label\"\n                    ></cr-topic>\n            </div>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                    image=\"household/topics/topic05\"\n                    view=\"$/angular/views/household/profile/topics/t05-dinner.html\"\n                    controller=\"ModalTopicCtrl\"\n                    window-class=\"cr-theme-magenta\"\n                    label=\"topic.cook.label\"\n                    ></cr-topic>\n            </div>\n        </div>\n\n        <div class=\"row\">\n\n            <button class=\"col-md-2\" ng-bind-html=\"'nav.to-actions' | translate\"\n                    ng-click=\"$root.redirectTo('/household-action')\">\n            </button>\n        </div>\n    </div>\n</div>");$templateCache.put('$/angular/views/household/profile/topics/t03-heating.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic03_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\"  ng-bind-html=\"'topic.heat.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n    <cr-question label=\"Q1600.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1600').doubleValue\" min=\"0\" max=\"1000\" step=\"10\" filter=\"toSquareMeters\"></cr-slider>\n    </cr-question>\n    <cr-question label=\"Q1900.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1900').doubleValue\" min=\"0\" max=\"20000\" step=\"500\" filter=\"toWatts\"></cr-slider>\n    </cr-question>\n\n    <cr-question label=\"Q1210.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1210').stringValue\" ng-steps=\"getNumericOptions('Q1210',0,5,1)\"></cr-slider>\n    </cr-question>\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/profile/topics/t01-presence.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic01_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.presence.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-question label=\"Q1300.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1300').doubleValue\" min=\"0\" max=\"20\" step=\"1\"></cr-slider>\n    </cr-question>\n\n    <cr-question label=\"Q1400.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1400').stringValue\" ng-steps=\"getNumericOptions('Q1400',0,5,1)\"></cr-slider>\n    </cr-question>\n\n    <cr-question label=\"Q1500.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1500').stringValue\" ng-steps=\"getOptions('Q1500')\" vertical=\"true\"></cr-slider>\n    </cr-question>\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/profile/topics/t02-programs.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic02_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.programs.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-section label=\"Q1110.label\">\n        <cr-question label=\"period.1.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1110','FIRST').stringValue\" ng-steps=\"getNumericOptions('Q1110',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.2.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1110','SECOND').stringValue\"  ng-steps=\"getNumericOptions('Q1110',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.3.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1110','THIRD').stringValue\" ng-steps=\"getNumericOptions('Q1110',0,5,1)\"></cr-slider>\n        </cr-question>\n    </cr-section>\n    <cr-section label=\"Q1120.label\">\n        <cr-question label=\"period.1.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1120','FIRST').stringValue\" ng-steps=\"getNumericOptions('Q1120',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.2.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1120','SECOND').stringValue\"  ng-steps=\"getNumericOptions('Q1120',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.3.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1120','THIRD').stringValue\" ng-steps=\"getNumericOptions('Q1120',0,5,1)\"></cr-slider>\n        </cr-question>\n    </cr-section>\n    <cr-section label=\"Q1130.label\">\n        <cr-question label=\"period.1.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1130','FIRST').stringValue\" ng-steps=\"getNumericOptions('Q1130',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.2.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1130','SECOND').stringValue\"  ng-steps=\"getNumericOptions('Q1130',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.3.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1130','THIRD').stringValue\" ng-steps=\"getNumericOptions('Q1130',0,5,1)\"></cr-slider>\n        </cr-question>\n    </cr-section>\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/profile/topics/t05-dinner.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic05_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\"  ng-bind-html=\"'topic.cook.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-section label=\"Q1140.label\">\n        <cr-question label=\"period.1.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1140','FIRST').stringValue\" ng-steps=\"getNumericOptions('Q1140',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.2.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1140','SECOND').stringValue\"  ng-steps=\"getNumericOptions('Q1140',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.3.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1140','THIRD').stringValue\" ng-steps=\"getNumericOptions('Q1140',0,5,1)\"></cr-slider>\n        </cr-question>\n    </cr-section>\n\n    <cr-section label=\"Q1150.label\">\n        <cr-question label=\"period.1.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1150','FIRST').stringValue\" ng-steps=\"getNumericOptions('Q1150',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.2.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1150','SECOND').stringValue\"  ng-steps=\"getNumericOptions('Q1150',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.3.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1150','THIRD').stringValue\" ng-steps=\"getNumericOptions('Q1150',0,5,1)\"></cr-slider>\n        </cr-question>\n    </cr-section>\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/profile/topics/t04-lighting.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic04_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\"  ng-bind-html=\"'topic.light.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-section label=\"Q1160.label\">\n        <cr-question label=\"period.1.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1160','FIRST').stringValue\" ng-steps=\"getNumericOptions('Q1160',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.2.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1160','SECOND').stringValue\"  ng-steps=\"getNumericOptions('Q1160',0,5,1)\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"period.3.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q1160','THIRD').stringValue\" ng-steps=\"getNumericOptions('Q1160',0,5,1)\"></cr-slider>\n        </cr-question>\n    </cr-section>\n    <cr-question label=\"Q1220.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1220').stringValue\" ng-steps=\"getNumericOptions('Q1220',0,5,1)\"></cr-slider>\n    </cr-question>\n    <cr-question label=\"Q1230.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1230').stringValue\" ng-steps=\"getNumericOptions('Q1230',0,5,1)\"></cr-slider>\n    </cr-question>\n    <cr-question label=\"Q1700.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1700').stringValue\" ng-steps=\"getNumericOptions('Q1700',0,5,1)\"></cr-slider>\n    </cr-question>\n    <cr-question label=\"Q1750.label\">\n        <cr-slider ng-model=\"getAnswerValue('Q1750').stringValue\" ng-steps=\"getOptions('Q1750')\" vertical=\"true\"></cr-slider>\n    </cr-question>\n    <cr-question label=\"Q1800.label\">\n        <cr-slider ng-model=\"Q1800\" min=\"0\" max=\"1000\" step=\"10\" filter=\"toWatts\"></cr-slider>\n    </cr-question>\n\n    <cr-section label=\"Q2000.label\">\n        <cr-question label=\"Q2010.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q2010').stringValue\" ng-steps=\"getOptions('Q2010')\" vertical=\"true\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"Q2020.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q2020').stringValue\" ng-steps=\"getOptions('Q2020')\" vertical=\"true\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"Q2030.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q2030').stringValue\" ng-steps=\"getOptions('Q2030')\" vertical=\"true\"></cr-slider>\n        </cr-question>\n        <cr-question label=\"Q2040.label\">\n            <cr-slider ng-model=\"getAnswerValue('Q2040').stringValue\" ng-steps=\"getOptions('Q2040')\" vertical=\"true\"></cr-slider>\n        </cr-question>\n    </cr-section>\n\n\n\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/action/household-action.html', "<div class=\"col-md-12\">\n    <h1>Ménage : Actions</h1>\n\n\n    <div class=\"container\">\n        <div class=\"row\">\n\n            <button class=\"col-md-2\" ng-bind-html=\"'nav.back-to-profile' | translate\"\n                    ng-click=\"$root.redirectTo('/household-profile')\">\n            </button>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                        image=\"household/topics/topic02\"\n                        view=\"$/angular/views/household/action/topics/t01-action-presence.html\"\n                        controller=\"ModalTopicCtrl\"\n                        window-class=\"cr-theme-green\"\n                        label=\"topic.presence.label\"\n                        ></cr-topic>\n            </div>\n\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                        image=\"household/topics/topic01\"\n                        view=\"$/angular/views/household/action/topics/t02-action-programs.html\"\n                        controller=\"ModalTopicCtrl\"\n                        window-class=\"cr-theme-blue\"\n                        label=\"topic.programs.label\"\n                        ></cr-topic>\n            </div>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                        image=\"household/topics/topic03\"\n                        view=\"$/angular/views/household/action/topics/t03-action-heating.html\"\n                        controller=\"ModalTopicCtrl\"\n                        window-class=\"cr-theme-orange\"\n                        label=\"topic.heat.label\"\n                        ></cr-topic>\n            </div>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                        active=\"true\"\n                        image=\"household/topics/topic04\"\n                        view=\"$/angular/views/household/action/topics/t04-action-lighting.html\"\n                        controller=\"ModalTopicCtrl\"\n                        window-class=\"cr-theme-red\"\n                        label=\"topic.light.label\"\n                        ></cr-topic>\n            </div>\n\n            <div class=\"col-md-3 col-sm-4 col-xs-6\">\n                <cr-topic\n                        image=\"household/topics/topic05\"\n                        view=\"$/angular/views/household/action/topics/t05-action-dinner.html\"\n                        controller=\"ModalTopicCtrl\"\n                        window-class=\"cr-theme-magenta\"\n                        label=\"topic.cook.label\"\n                        ></cr-topic>\n            </div>\n\n            <button class=\"col-md-2\" ng-bind-html=\"'nav.to-identification' | translate\"\n                    ng-click=\"openModal('household/account/registration')\">\n            </button>\n        </div>\n\n        <row>\n\n\n            <button class=\"col-md-2\"\n                    ng-click=\"save()\"> SAVE !!\n            </button>\n\n        </row>\n    </div>\n</div>");$templateCache.put('$/angular/views/household/action/topics/t01-action-presence.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic01_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.presence.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-question label=\"Q3210.label\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3210').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3211.label\" cr-conditionned=\"Q3211\" >\n        <cr-slider ng-model=\"getAnswerValue('Q3211').stringValue\" ng-steps=\"getNumericOptions('Q3211',1,4,1)\"></cr-slider>\n    </cr-question>\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/action/topics/t05-action-dinner.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic01_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.cook.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n\n    <cr-question label=\"Q3710.label\"  cr-conditionned=\"Q3710\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3710').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3711.label\"  cr-conditionned=\"Q3711\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3711').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3720.label\"  cr-conditionned=\"Q3720\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3720').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3730.label\"  cr-conditionned=\"Q3730\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3730').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3750.label\"  cr-conditionned=\"Q3750\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3750').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3760.label\"  cr-conditionned=\"Q3760\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3760').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3740.label\"  cr-conditionned=\"Q3740\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3740').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3741.label\"  cr-conditionned=\"Q3741\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3741').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/action/topics/t02-action-programs.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic01_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.programs.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-question label=\"Q3110.label\"  cr-conditionned=\"Q3110\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3110').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3120.label\" cr-conditionned=\"Q3120\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3120').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3130.label\" cr-conditionned=\"Q3130\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3130').booleanValue\"></cr-boolean>\n    </cr-question>\n    \n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/action/topics/t04-action-lighting.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic01_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.light.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-question label=\"Q3410.label\"  cr-conditionned=\"Q3410\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3410').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3420.label\" cr-conditionned=\"Q3420\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3420').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3510.label\" cr-conditionned=\"Q3510\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3510').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3530.label\" cr-conditionned=\"Q3530\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3530').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3610.label\" cr-conditionned=\"Q3610\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3610').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3620.label\" cr-conditionned=\"Q3620\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3620').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3630.label\" cr-conditionned=\"Q3630\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3630').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3631.label\" cr-conditionned=\"Q3631\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3631').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3640.label\" cr-conditionned=\"Q3640\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3640').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n    <cr-question label=\"Q3810.label\" cr-conditionned=\"Q3810\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3810').booleanValue\"></cr-boolean>\n    </cr-question>\n\n\n\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/household/action/topics/t03-action-heating.html', "<div class=\"modal-header\">\n    <img class=\"cr-modal-title-icon\" src=\"/assets/images/modal/topic01_title.png\" alt=\"\"/>\n    <img class=\"cr-modal-title-separator\" src=\"/assets/images/modal/title_verticalSeparator.png\" alt=\"\"/>\n    <h3 class=\"modal-title cr-modal-title-text\" ng-bind-html=\"'topic.heat.label' | translate\"></h3>\n</div>\n<div class=\"modal-body\">\n\n\n    <cr-question label=\"Q3310.label\"  cr-conditionned=\"Q3310\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3310').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3320.label\" cr-conditionned=\"Q3320\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3320').booleanValue\"></cr-boolean>\n    </cr-question>\n\n    <cr-question label=\"Q3330.label\" cr-conditionned=\"Q3330\">\n        <cr-boolean ng-model=\"getAnswerValue('Q3330').booleanValue\"></cr-boolean>\n    </cr-question>\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/views/login_modal.html', "<div class=\"modal-header\">\n    <h3 class=\"modal-title\" ng-bind-html=\"login.modal.title\"></h3>\n</div>\n<div class=\"modal-body\">\n\n    <cr-question label=\"generic.emailAddress\">\n        <cr-text ng-model=\"o.email\"></cr-text>\n    </cr-question>\n    <cr-question label=\"generic.password\">\n        <cr-text ng-model=\"o.password\"></cr-text>\n    </cr-question>\n\n</div>\n<div class=\"modal-footer\">\n    <button class=\"btn btn-primary\" ng-click=\"valid()\" ng-bind-html=\"'generic.valid' | translate\"></button>\n    <button class=\"btn btn-warning\" ng-click=\"close()\" ng-bind-html=\"'generic.close' | translate\"></button>\n</div>");$templateCache.put('$/angular/templates/cr-question.html', "<div class=\"cr-question\">\n\n    <div class=\"row\">\n        <div ng-class=\"{'col-md-1': getInline() == 'true', 'col-md-12': getInline() != 'true'}\">\n            <label class=\"cr-question-label\" ng-bind-html=\"getLabel() | translate\"></label>\n        </div>\n        <div ng-class=\"{'col-md-11': getInline() == 'true', 'col-md-12': getInline() != 'true'}\">\n            <div class=\"cr-question-editor\" ng-transclude></div>\n        </div>\n    </div>\n\n\n</div>");$templateCache.put('$/angular/templates/cr-boolean.html', "<cr-slider ng-model=\"ngModel\" ng-steps=\"steps\"></cr-slider>");$templateCache.put('$/angular/templates/cr-section.html', "<div class=\"cr-section\">\n    <div class=\"row\">\n        <div class=\"col-md-12\">\n            <label class=\"cr-section-label\" ng-bind-html=\"getLabel() | translate\"></label>\n        </div>\n    </div>\n    <div class=\"row\">\n        <div class=\"col-xs-11 col-xs-offset-1\">\n            <div class=\"cr-section-editor\" ng-transclude></div>\n        </div>\n    </div>\n</div>");$templateCache.put('$/angular/templates/cr-double-range.html', "<div class=\"cr-range\">\n\n    <div range-slider min=\"ngRangeMin\" max=\"ngRangeMax\" model-min=\"ngMin\" model-max=\"ngMax\" step=\"ngStep\"\n         disabled=\"ngDisabled\"></div>\n\n</div>");$templateCache.put('$/angular/templates/cr-radio.html', "<div class=\"cr-radio\">\n\n    <div class=\"btn-group\" ng-hide=\"edit\">\n        <button class=\"btn btn-default  \"\n                ng-class=\"{active: isValue(o.value)}\"\n                ng-repeat=\"o in computedOptions\"\n                ng-click=\"setValue(o.value)\"\n                ng-bind-html=\"('' + o.label) | translate\"\n                ></button>\n\n        <button ng-if=\"getFreeAllowed() == 'true'\"\n                class=\"btn btn-danger\"\n                ng-click=\"toggle()\">\n            <span class=\"fa fa-pencil\"></span>\n        </button>\n\n    </div>\n\n    <div class=\"input-group\" ng-show=\"edit\">\n\n        <input type=\"text\" class=\"form-control\" ng-model=\"ngModel\"/>\n\n        <span class=\"input-group-btn\">\n            <button\n                    ng-show=\"getFreeAllowed() == 'true'\"\n                    class=\"btn btn-danger\"\n                    ng-click=\"toggle()\">\n                <span class=\"fa fa-eraser\"></span>\n            </button>\n      </span>\n\n    </div>\n\n</div>");$templateCache.put('$/angular/templates/mm-field-date.html', "<div class=\"field_row\" ng-hide=\"getInfo().hidden === true\"><div ng-click=\"logField()\">{{getInfo().fieldTitle}}</div><div><div class=\"dropdown\"></div><a class=\"dropdown-toggle\" data-target=\"#\" id=\"{{id}}\" role=\"button\" data-toggle=\"dropdown\" href=\"\"><div class=\"input-group\"><input class=\"form-control\" ng-model=\"resultFormated\" type=\"text\"><span class=\"input-group-addon\"><i class=\"glyphicon glyphicon-calendar\"></i></span></div><ul class=\"dropdown-menu date_input\" aria-labelledby=\"dLabel\" role=\"menu\"><datetimepicker data-ng-model=\"result\" data-datetimepicker-config=\"{ dropdownSelector: '{{idHtag}}',minView:'day' }\"></datetimepicker></ul></a></div><div><img src=\"/assets/images/field_valid.png\" ng-if=\"!hideIsValidIcon\" ng-show=\"getInfo().isValid\"><div class=\"error_message\" ng-hide=\"getInfo().isValid\"><img src=\"/assets/images/field_invalid.png\"><div>{{getInfo().validationMessage}}</div></div><div ng-transclude></div></div></div>");$templateCache.put('$/angular/templates/mm-field-text.html', "<div class=\"field_row\" ng-hide=\"getInfo().hidden === true\"><div ng-click=\"logField()\">{{getInfo().fieldTitle}}</div><div><div class=\"field_error_message_flash\" ng-show=\"errorMessage.length&gt;0\"><div>{{errorMessage}}</div><img src=\"/assets/images/question_field_error_message_icon_arrow.png\"></div><input ng-disabled=\"getInfo().disabled\" placeholder=\"{{getInfo().placeholder}}\" numbers-only=\"{{getInfo().numbersOnly}}\" focus-me=\"getInfo().focus()\" ng-class=\"{input_number: getInfo().numbersOnly === 'integer' || getInfo().numbersOnly === 'double'}\" ng-model=\"getInfo().field\" type=\"{{fieldType}}\"></div><div><div ng-if=\"isValidationDefined\"><img src=\"/assets/images/field_valid.png\" ng-if=\"!hideIsValidIcon\" ng-show=\"getInfo().isValid\"><div class=\"error_message\" ng-hide=\"getInfo().isValid\"><img src=\"/assets/images/field_invalid.png\"><div>{{getInfo().validationMessage}}</div></div></div><div ng-transclude></div></div></div>");$templateCache.put('$/angular/templates/mm-field-auto-completion.html', "<div class=\"field_row\" ng-hide=\"getInfo().hidden === true\"><div ng-click=\"logField()\">{{getInfo().fieldTitle}}</div><div><angucomplete minlength=\"1\" pause=\"400\" ng-disabled=\"getInfo().disabled\" id=\"members\" titlefield=\"content\" inputclass=\"form-control form-control-small\" placeholder=\"{{getInfo().placeholder}}\" selectedobject=\"result\" datafield=\"values\" url=\"{{getInfo().url}}\"></angucomplete></div><div><img src=\"/assets/images/field_valid.png\" ng-if=\"!hideIsValidIcon\" ng-show=\"getInfo().isValid\"><div class=\"error_message\" ng-hide=\"getInfo().isValid\"><img src=\"/assets/images/field_invalid.png\"><div>{{getInfo().validationMessage}}</div></div><div ng-transclude></div></div></div>");$templateCache.put('$/angular/templates/cr-text.html', "<div class=\"cr-text\">\n\n    <input\n        ng-show=\"getMultiline() != 'true'\"\n        ng-attr-name=\"{{ getName() }}\"\n        class=\"form-control cr-text-input\"\n        ng-model=\"ngModel\"/>\n\n    <textarea ng-show=\"getMultiline() == 'true'\"\n              ng-attr-name=\"{{ getName() }}\"\n              class=\"form-control cr-text-textarea\"\n              ng-model=\"ngModel\"></textarea>\n\n</div>");$templateCache.put('$/angular/templates/cr-number.html', "<div class=\"cr-number\">\n\n    <input\n            class=\"form-control cr-number-input\"\n            ng-model=\"ngModel\"/>\n\n</div>");$templateCache.put('$/angular/templates/cr-dropdown.html', "<div class=\"cr-dropdown\">\n\n    <div class=\"btn-group cr-dropdown-control\"\n         dropdown>\n\n        <button type=\"button\"\n                class=\"btn btn-default dropdown-toggle cr-dropdown-button\"\n                dropdown-toggle\n                ng-disabled=\"getDisabled()\">\n            {{ ngModel }} <span class=\"caret\"></span>\n        </button>\n\n        <ul class=\"dropdown-menu cr-dropdown-menu\"\n            role=\"menu\">\n            <li ng-repeat=\"o in ngOptions\" class=\"cr-dropdown-menu-item\" ng-class=\"{divider: (o == '-')}\">\n                <a class=\"cr-dropdown-menu-item-link\" ng-if=\"o != '-'\" ng-click=\"$select(o)\">{{ o }}</a>\n            </li>\n        </ul>\n    </div>\n\n</div>");$templateCache.put('$/angular/templates/cr-topic.html', "<button class=\"cr-topic {{ getWindowClass() }}\" ng-class=\"{active: getActive() == 'true'}\" ng-click=\"open()\" >\n\n    <img class=\"cr-topic-image-active\"\n         ng-src=\"/assets/images/{{getImage()}}_active.png\"/>\n\n    <img class=\"cr-topic-image-inactive\"\n         ng-src=\"/assets/images/{{getImage()}}_inactive.png\"/>\n\n    <img class=\"cr-topic-image-hover\"\n         ng-src=\"/assets/images/{{getImage()}}_hover.png\"/>\n\n    <div class=\"cr-topic-text \" ng-bind-html=\"getLabel() | translate\"></div>\n</button>");$templateCache.put('$/angular/templates/cr-slider.html', "<div class=\"cr-slider\" collapse=\"!isVisible()\">\n\n    <div class=\"cr-slider-container\" ng-if=\"!getVertical()\">\n\n        <!-- Sections -->\n            <span class=\"cr-slider-section first\"\n                  ng-repeat=\"o in computedOptions\"\n                  style=\"left: 0px\"\n                >\n            </span>\n\n        <div class=\"cr-slider-null-box\">\n              <span class=\"cr-slider-tick first\"\n                    ng-mousedown=\"setValue(computedOptions[0])\"\n                    style=\"left: 0px\"\n                  ></span>\n\n        </div>\n\n        <div class=\"cr-slider-not-null-box\">\n\n            <!-- Sections -->\n            <span class=\"cr-slider-section\"\n                  style=\"left: 0px; width: {{ (computedOptions.length-2) * 50.0 }}px\"\n                >\n            </span>\n\n            <!-- Ticks -->\n\n            <span class=\"cr-slider-tick\"\n                  ng-repeat=\"o in computedOptions\"\n                  ng-if=\"o.value != null\"\n                  ng-class=\"{active: isValue(o), first: ($index == 0)}\"\n                  ng-mousedown=\"setValue(o)\"\n                  style=\"left: {{ ($index - 1) * 50 }}px\"\n                ></span>\n\n\n            <!-- Labels -->\n\n            <span class=\"cr-slider-text\"\n                  ng-repeat=\"o in computedOptions\"\n                  ng-if=\"o.label != null\"\n                  ng-class=\"{active: isValue(o)}\"\n                  ng-mousedown=\"setValue(o)\"\n                  style=\"left: {{ ($index - 1 )* 50}}px\"\n                  ng-bind-html=\"labelFilter('' + o.label)\"\n                ></span>\n\n\n        </div>\n    </div>\n\n    <div class=\"cr-slider-container-vertical\" ng-if=\"getVertical()\"\n         style=\"height: {{ computedOptions.length * 50.0 }}px\" ng-show=\"computedOptions.length <= 3\">\n\n        <!-- Sections -->\n            <span class=\"cr-slider-section first\"\n                  ng-repeat=\"o in computedOptions\"\n                  style=\"left: 0px\"\n                >\n            </span>\n\n        <div class=\"cr-slider-null-box\">\n              <span class=\"cr-slider-tick first\"\n                    ng-mousedown=\"setValue(computedOptions[0])\"\n                    style=\"left: 0px\"\n                  ></span>\n\n        </div>\n\n        <div class=\"cr-slider-not-null-box\" style=\"height: {{ computedOptions.length * 50.0 }}px\">\n\n            <!-- Sections -->\n            <span class=\"cr-slider-section\"\n                  style=\"top: 0px; height: {{ (computedOptionsFiltered.length-2) * 50.0 }}px\"\n                >\n            </span>\n\n            <!-- Ticks -->\n\n            <span class=\"cr-slider-tick\"\n                  ng-repeat=\"o in computedOptions\"\n                  ng-if=\"o.value != null\"\n                  ng-class=\"{active: isValue(o), first: ($index == 0)}\"\n                  ng-mousedown=\"setValue(o)\"\n                  style=\"top: {{ ($index - 1) * 50 }}px\"\n                ></span>\n\n\n            <!-- Labels -->\n\n            <span class=\"cr-slider-text\"\n                  ng-repeat=\"o in computedOptions\"\n                  ng-if=\"o.label != null\"\n                  ng-class=\"{active: isValue(o)}\"\n                  ng-mousedown=\"setValue(o)\"\n                  style=\"top: {{ ($index - 1 )* 50}}px\"\n                  ng-bind-html=\"labelFilter('' + o.label)\"\n                ></span>\n\n\n        </div>\n    </div>\n\n\n    <div class=\"cr-slider-container-vertical\" ng-if=\"getVertical() == 'true'\"\n         style=\"height: {{ computedOptionsFiltered.length * 50.0 }}px\" ng-hide=\"computedOptions.length <= 3\">\n\n\n        <!-- Sections -->\n            <span class=\"cr-slider-section first\"\n                  ng-repeat=\"o in computedOptionsFiltered\"\n                  style=\"left: 0px\"\n                >\n            </span>\n\n        <div class=\"cr-slider-null-box\">\n              <span class=\"cr-slider-tick first\"\n                    ng-mousedown=\"setValue(computedOptionsFiltered[0])\"\n                    style=\"left: 0px\"\n                  ></span>\n\n        </div>\n\n        <div class=\"cr-slider-not-null-box\" style=\"height: {{ computedOptionsFiltered.length * 50.0 }}px\">\n\n\n            <!-- Sections -->\n            <span class=\"cr-slider-section\"\n                  style=\"top: 0px; height: {{ (computedOptionsFiltered.length-2) * 50.0 }}px\"\n                >\n            </span>\n\n            <!-- Ticks -->\n\n            <span class=\"cr-slider-tick\"\n                  ng-repeat=\"o in computedOptionsFiltered\"\n                  ng-show=\"o.value != null\"\n                  ng-class=\"{active: isValue(o), first: ($index == 0)}\"\n                  ng-mousedown=\"setValue(o)\"\n                  style=\"top: {{ ($index - 1) * 50 }}px\"\n                ></span>\n\n\n            <!-- Labels -->\n\n            <span class=\"cr-slider-text\"\n                  ng-repeat=\"o in computedOptionsFiltered\"\n                  ng-show=\"o.label != null\"\n                  ng-class=\"{active: isValue(o)}\"\n                  ng-mousedown=\"setValue(o)\"\n                  style=\"top: {{ ($index - 1 )* 50}}px\"\n                  ng-bind-html=\"labelFilter('' + o.label)\"\n                ></span>\n\n            <span class=\"cr-slider-text\"\n                  ng-hide=\"expanded\"\n                  ng-mousedown=\"toggleExpanded()\"\n                  style=\"top: {{ (computedOptionsFiltered.length - 2 )* 50}}px\"\n                >...</span>\n\n\n        </div>\n\n\n    </div>\n</div>");});