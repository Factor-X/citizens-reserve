angular
.module('app.controllers')
.controller "ResultsCtrl", ($scope, modalService, $filter, $timeout, $log, downloadService, surveyDTOService) ->
    $scope.isAuthenticated = ->
        return surveyDTOService.isAuthenticated()

    $scope.nbParticipants = null
    $scope.effectiveAverageReduction = null
    $scope.totalEffectiveAverageReduction = null

    $scope.options =
        chart:
            type: 'lineChart',
            forceY: [0]
            height: 450,
            margin:
                top: 20,
                right: 20,
                bottom: 60,
                left: 55
            x: (d) ->
                return d.x
            y: (d) ->
                return d.y
            showValues: true
            interactive: false
            transitionDuration: 500,
            xAxis:
                axisLabel: ''
                tickValues: [17, 18, 19, 20]
                showMaxMin: false
                tickFormat: (d)->
                    return $filter('toHour')(parseInt(d))
            yAxis:
                axisLabel: '',
                axisLabelDistance: 30
                showMaxMin: false
                tickFormat: (d)->
                    return $filter('toWatts')(parseInt(d))

    $scope.data = []

    downloadService.postJson '/reduction/effective', surveyDTOService.surveyDTO, (result) ->
        if result.success

            $scope.effectiveAverageReduction = $filter('number')(parseFloat(result.data.reductions[0].averagePowerReduction), 0)

            v1 = result.data.reductions[0].firstPeriodPowerReduction
            v2 = result.data.reductions[0].secondPeriodPowerReduction
            v3 = result.data.reductions[0].thirdPeriodPowerReduction

            result = regression('polynomial', [
                [17, v1],
                [18, v1],
                [18, v2],
                [19, v2],
                [19, v3],
                [20, v3]
            ], 2)


            $scope.data = [

#                {
#                    key: $filter('translate')('results.stack.name'),
#                    color: '#229913'
#                    area: true
#                    values: [
#                        { x: 17, y: v1 },
#                        { x: 18, y: v1 },
#                        { x: 18, y: v2 },
#                        { x: 19, y: v2 },
#                        { x: 19, y: v3 },
#                        { x: 20, y: v3 },
#                    ]
#                },
                {
                    key: $filter('translate')('results.trend.name')
                    color: '#28DB15'
                    values: _.map(_.range(17, 20.05, 0.1), (x) ->
                        return { x: x, y: result.equation[2] * x * x + result.equation[1] * x + result.equation[0] }
                    )
                }
            ];


    $scope.getSummaryResult = ->
        downloadService.getJson '/stats/summaryValues', (result) ->
            if result.success
                summaryResult = result.data
                if (!!summaryResult)
                    $scope.totalEffectiveAverageReduction = $filter('number')(parseFloat(summaryResult.effectiveReduction) / 1000.0, 0)
                    $scope.nbParticipants = summaryResult.nbParticipants
            else
                console.log(result.data)

    $scope.getSummaryResult();


    #twitter
    $timeout(() ->
        a = (d, s, id) ->
            js = undefined
            fjs = d.getElementsByTagName(s)[0]
            p = (if /^http:/.test(d.location) then "http" else "https")
            unless d.getElementById(id)
                js = d.createElement(s)
                js.id = id
                js.src = p + "://platform.twitter.com/widgets.js"
                fjs.parentNode.insertBefore js, fjs
            return
        a(document, "script", "twitter-wjs")
    , 0)
