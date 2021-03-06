angular
.module('app.controllers')
.controller "RegistrationCtrl", ($scope, modalService, $log, downloadService, surveyDTOService, optionService, $state, $flash, $stateParams) ->
    $scope.noSubmitYet = true
    $scope.loading = false

    $scope.getOptions = (questionKey) ->
        return optionService.getOptions(questionKey)

    $scope.getAnswerValue = (questionKey, periodKey) ->
        return surveyDTOService.getAnswerValue(questionKey, periodKey)

    $scope.getAccount = () ->
        return surveyDTOService.getAccount()

    $scope.getNumericOptions = (questionKey, min, max, step) ->
        return optionService.getNumericOptions(questionKey, min, max, step)

    $scope.openModal = (target, controller = 'ModalTopicCtrl') ->
        modalInstance = modalService.open({
            templateUrl: '$/angular/views/' + target + '.html',
            controller: controller,
            size: 'lg'
        })

    $scope.logout = () ->
        downloadService.postJson '/logout', surveyDTOService.surveyDTO, (result) ->
            if result.success
                $state.go('root.welcome')
                surveyDTOService.logout()
                $flash.success 'logout.success'
        return

    $scope.validation = {
        firstName:
            pattern: /^.{2,100}$/
            valid: false
        lastName:
            pattern: /^.{2,100}$/
            valid: false
        emailAddress:
            pattern: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            valid: false
        password:
            pattern: /^[a-zA-Z0-9-_%]{6,18}$/
            valid: false
        repeatPassword:
            validation: ->
                return $scope.getAccount().password == $scope.o.repeatPassword
            valid: false
        powerConsumption:
            valid: () ->
                if (!surveyDTOService.getAccount().powerConsumption?)
                    return false
                powerConsumption = surveyDTOService.getAccount().powerConsumption
                if (!!powerConsumption)
                    powerConsumption = powerConsumption.replace(",", ".")
                    return !isNaN(Number(powerConsumption)) and (Number(powerConsumption) >= 0)
                return true
        terms:
            valid: surveyDTOService.isAuthenticated()
    }

    $scope.zip =
        pattern: /^.{0,20}$/
        valid: false

    $scope.o = {
        errorMessage: ""
        repeatPassword: $scope.getAccount().password
        acceptAgreement: surveyDTOService.isAuthenticated()
    }

    $scope.saveEnterprise = () ->
        $scope.noSubmitYet = false
        if $scope.checkValidity()
            $scope.loading = true

            # add the language
            surveyDTOService.setLanguage($stateParams.lang)

            surveyDTOService.surveyDTO.account.powerConsumption = surveyDTOService.surveyDTO.account.powerConsumption.replace(/,/g, '.')

            console.log "DTO to save"
            console.log surveyDTOService.surveyDTO

            downloadService.postJson '/registration', surveyDTOService.surveyDTO, (result) ->
                $scope.loading = false
                console.log $state
                if result.success
                    surveyDTOService.setAccount(result.data.account)
                    $flash.success 'account.save.success'
                    $state.go 'root.' + $state.current.resolve.instanceName() + 'Actions'
                else
                    $flash.error result.data.message


    $scope.save = () ->
        $scope.noSubmitYet = false

        # the following has been added otherwise checkValidity() below would return false -> the form would not be submitted ...
        surveyDTOService.surveyDTO.account.powerConsumption = 0

        if $scope.checkValidity()

            $scope.loading = true

            # add the language
            surveyDTOService.setLanguage($stateParams.lang)

            console.log "DTO to save"
            console.log surveyDTOService.surveyDTO
            downloadService.postJson '/registration', surveyDTOService.surveyDTO, (result) ->
                $scope.loading = false
                if result.success
                    surveyDTOService.setAccount(result.data.account)
                    $flash.success 'account.save.success'
                    $state.go 'root.householdResults'
                else
                    $flash.error result.data.message


    $scope.checkValidity = () ->
        for key in Object.keys($scope.validation)
            console.log "GHO"
            console.log $scope.validation
            valid = $scope.validation[key].valid
            if _.isFunction(valid)
                if valid() == false
                    return false
            else if valid == false
                return false
        return true

    $scope.isAuthenticated = ->
        return surveyDTOService.isAuthenticated()

