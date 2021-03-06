angular
.module('app.controllers')
.controller "ControlsDemoCtrl", ($scope, modalService, $log, gettextCatalog, $flash) ->
    #
    # Initialize
    #
    $scope.setLanguage = (lang) ->
        gettextCatalog.setCurrentLanguage(lang)

    $scope.x =
        sel: 'Human'
        items: [
            'Human'
            'B@t'
            '-'
            'Vampire'
        ]
        cnt: 10
        firstName: 'Winston'
        password: '123'
        comment: 'Attitude is a little thing that makes a big difference.'
        doubleRange:
            min: 2
            max: 3
            rangeMin: 0
            rangeMax: 5
        radio:
            value: null
            options: [
                {value: 0, label: 'OPT_0'}
                {value: 1, label: 'OPT_1'}
                {value: 2, label: 'OPT_2'}
                {value: 3, label: 'OPT_3'}
                {value: 4, label: 'OPT_4'}
            ],
            simpleOptions: [ 0, 1, 2, 3, 4 ]
        slider:
            value: null
            steps: [
                {value: null, label: null}
                {value: 18, label: '18h'}
                {value: 19, label: '19h'}
                {value: 20, label: '20h'}
                {value: 21, label: '21h'}
                {value: 22, label: '22h'}
            ],
            simpleSteps: [ null, 18, 19, 20, 21, 22 ]

        continuousSlider:
            value: 100
            step: 10
            min: 20
            max: 2000

        yesno:
            value: null



        grid: [
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?2165438536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216548536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216438536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216543836158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216543853615851968161'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/128/512?3216543853615519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3215438536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216543853615851981651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216548536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216543536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/800?3165438536158519681651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3216543853615851981651'}
            {title: 'AAA', content: 'Hello world', image: 'http://placekitten.com/512/512?3215438536158519681651'}
        ]


    $scope.$watch 'x.sel', (n, o) ->
        if n == $scope.x.items[3]
            modalInstance = modalService.open({
                templateUrl: '$/angular/views/test/modal-confirm-vampire.html',
                controller: 'NiceModalCtrl',
                size: 'sm'
                resolve:
                    chosenValue: () ->
                        return $scope.x.sel

            });

            modalInstance.result.then (result) ->
                $log.info(result)
                $flash.success 'success'
                $flash.info 'info'
                $flash.error 'error'
                $flash.warning 'warning'
            , () ->
                $scope.x.sel = o
                $log.info('Modal dismissed at: ' + new Date())

