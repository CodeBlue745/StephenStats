'use strict';

angular.module('roms.home', ['ngRoute', 'ui.bootstrap', 'roms.datepicker'])
    .controller('PatientController', PatientController);

PatientController.$inject = ['$rootScope', '$scope', 'patientservice', 'outcomeservice', 'subscoreservice', '$moment',
    '$uibModal', '$log', '$window', '$location', 'auditservice','departmentservice'];


function PatientController($rootScope, $scope, patientservice, outcomeservice, subscoreservice, $moment, $uibModal, $log, $window,
                           $location, auditservice, departmentservice) {
    var vm = this;
    var msprId = -1;    

    if ($rootScope.globals !== undefined && $rootScope.globals.currentUser !== undefined && $rootScope.globals.currentUser.msprId !== undefined) {
        msprId = Number($rootScope.globals.currentUser.msprId);
    }

    vm.showMessage = false;
    vm.patient = {facility: '', treatingTherapist: '', referringPhysician: '', accountNo: '', departments:'', department:'', edReferCd:'', edfacility:''};
    vm.patient.admDate = new Date();
    vm.selectedRow = 0;
    vm.patients = [];
    vm.showESurvey = true;

    vm.showSummaryFlag = false;
    vm.editPatientFlag = false;
    vm.editAdmitFlag = false;
    vm.readmitFlag = false;
    vm.dischargedPatientFlag = false;
    vm.flags = {};
    vm.modalWindowClass = 'patient-admit-modal';

    vm.searchPatient = searchPatient;
    vm.resetPatient = resetPatient;
    vm.displayDetails = displayDetails;
    vm.updateDetails = updateDetails;
    vm.setClickedRow = setClickedRow;
    
    vm.calculateStartbackRisk = calculateStartbackRisk;
    vm.checkForSubscores = checkForSubscores;
    vm.backToSearch = backToSearch;

    vm.addNewPatient = addNewPatient;
    vm.readmit = readmit;
    vm.editAdmit = editAdmit;
    vm.editPatient = editPatient;
    
    vm.openPatientModal = openPatientModal;
    vm.openClassificationModal = openClassificationModal;
    //Add radio buttons to main page.
    //vm.sortClassificationDefinitions = sortClassificationDefinitions;
    vm.openDischargeModal = openDischargeModal;
    vm.openOutcomeModal = openOutcomeModal;
    vm.openESurveyModal = openESurveyModal;
    vm.openSurveyResponses = openSurveyResponses;
    vm.openComparisonReport = openComparisonReport;
    vm.openOutcomesReport = openOutcomesReport;
    vm.patientReportAudit = patientReportAudit;
    vm.triggerSearchPatient = triggerSearchPatient;

    function searchPatient(searchString) {
        vm.searchString = searchString;
        return patientservice.searchPatient(searchString, vm.dischargedPatientFlag)
            .then(function (data) {
                vm.patients = data;
                var patients = [];
                if (data === null || data === undefined || data.length === 0) {
                    vm.message = 'No Results Found. Please try a different search criteria.';
                } else {
                    for(var i = 0; i<data.length; i++) {
                        var p = data[i];
                        var patient = {id: p.patientId,
                            name: p.lastNm + ', ' + p.firstNm + ' (Patient MRN: ' + p.empi + ', DOB: ' + p.birthDtStr + ')'};
                        patients.push(patient);
                    }
                    vm.message = '';
                }

                return patients.map(function (item) {
                    return item;
                });
            });
    }

    function backToSearch() {
        vm.resetPatient();
    }

    function resetPatient() {
        vm.patient = {};
        vm.currentAdmit = {};
        vm.patient = {facility: '', treatingTherapist: '', referringPhysician: '', accountNo: '', departments:'', department:'', edRefer:'', edfacility:'' };
        vm.surveys = null;
        vm.classifications = null;
        vm.showSummaryFlag = false;
    }

    function displayDetails(patientId) {
        patientservice.getPatientDetails(patientId)
            .then(function (data) {
                if (data) {
                    vm.patient = data;
                    vm.patient.birthDt = $moment(vm.patient.birthDtStr, 'MM/DD/YYYY')._d;
                    if (vm.admitId > 0) {
                        for (var i = 0; i < vm.patient.admits.length; i++) {
                            if (vm.patient.admits[i].admitId === vm.admitId) {
                                vm.surveys = vm.patient.admits[i].surveys;
                                vm.classifications = vm.patient.admits[i].classifications;
                                break;
                            }
                        }
                    } else {
                        vm.selectedRow = 0;
                        if (vm.patient.admits.length > 0) {
                            vm.admitId = vm.patient.admits[0].admitId;
                            vm.surveys = vm.patient.admits[0].surveys;
                            vm.classifications = vm.patient.admits[0].classifications;
                            vm.currentAdmit = vm.patient.admits[0];
                        }
                    }
                    vm.calculateStartbackRisk();
                    vm.checkForSubscores();
                    vm.showSummaryFlag = true;
                } else {
                    $log.info('No data retrieved.');
                }
            });
    }

    function calculateStartbackRisk() {
        if (vm.surveys) {
            for (var i = 0; i < vm.surveys.length; i++) {
                var selectedSurvey = vm.surveys[i];
                if (selectedSurvey.surveyType === 'START') {
                    selectedSurvey.startbackRisk = '';
                    if (selectedSurvey.surveyScore <= 3) {
                        selectedSurvey.startbackRisk = 'Low risk';
                    } else if (selectedSurvey.surveyScore >= 4 && selectedSurvey.startbackSubscore <= 3) {
                        selectedSurvey.startbackRisk = 'Medium risk';
                    } else if (selectedSurvey.surveyScore >= 4 && selectedSurvey.startbackSubscore > 3) {
                        selectedSurvey.startbackRisk = 'High risk';
                    }
                }
            }
        }
    }

    function setClickedRow(index) {  //function that sets the value of selectedRow to current index
        vm.selectedRow = index;
    }

    function updateDetails(admit) {
        vm.currentAdmit = admit;
        vm.admitId = admit.admitId;
        vm.surveys = admit.surveys;
        vm.classifications = admit.classifications;
        vm.calculateStartbackRisk();
        vm.checkForSubscores();
    }

    function checkForSubscores() {
        if(vm.surveys !== null && vm.surveys !== undefined) {
            vm.surveys = vm.surveys.filter(function(survey){
                if(survey.surveyType === 'PFDI' || survey.surveyType === 'PFIQ') {
                    survey.subscores = subscoreservice.getSubscores(survey);
                }
                return survey;
            });
        }

    }

    function getOutcomes(){
        outcomeservice.getOutcomes(vm.patient.patientId, vm.admitId)
            .then(function (data) {
                if (data !== undefined && data.length > 0) {
                    vm.surveys = data;
                    for (var i = 0; i < vm.patient.admits.length; i++) {
                        if (vm.patient.admits[i].admitId === vm.admitId) {
                            vm.calculateStartbackRisk();
                            vm.patient.admits[i].surveys = vm.surveys;
                            vm.checkForSubscores();
                            break;
                        }
                    }
                } else {
                    vm.surveys = [];
                }
            });
    }

    function addNewPatient() {
        vm.resetPatient();
        vm.openPatientModal();
    }

    function readmit() {
        vm.readmitFlag = true;
        vm.openPatientModal();
    }

    function editPatient() {
        vm.editPatientFlag = true;
        vm.openPatientModal();
    }

    function editAdmit(admit) {
        var selectedAdmit = angular.copy(admit);        
        vm.selectedAdmit = selectedAdmit;
        vm.editAdmitFlag = true;
        vm.openPatientModal();
    }

    /*
    Reset flags after patient admit modal window has been dismissed
    */
    function resetFlags(){
        vm.editPatientFlag = false;
        vm.editAdmitFlag = false;
        vm.readmitFlag = false;
    }

    /*
    Set Flags before opening patient admit modal window
    */
    function setPatientFlags(){
        vm.flags = {
            readmitFlag: vm.readmitFlag,
            editAdmitFlag: vm.editAdmitFlag,
            editPatientFlag: vm.editPatientFlag
        };
    }

    /*
    Modal window for adding new patient or admit, editing a patient or admit, or readmitting a patient.
    */
    function openPatientModal() {
        setPatientFlags();
        vm.modalWindowClass = (vm.editPatientFlag ? 'edit-patient-modal':'patient-admit-modal');
        var patientCopy = angular.copy(vm.patient);
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'patientAdmitComponent',
            windowClass: vm.modalWindowClass,
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        patient: patientCopy,
                        selectedAdmit: vm.selectedAdmit,
                        patients: vm.patients,
                        flags: vm.flags,
                    };
                }
            }
        });

        modalInstance.result.then(function (results) {
            //Refresh the appropriate details
            if(vm.editAdmitFlag){
                updateDetails(vm.selectedAdmit);
            }
            vm.admitId = '';
            vm.displayDetails(results.patientId);
            resetFlags();

        }, function () {
            resetFlags();
            $log.info('Patient/Admit Info modal dismissed at: ' + new Date());
        });
    }

    function openComparisonReport(){
        var selectedAdmit = angular.copy(vm.currentAdmit);
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'comparisonReportComponent',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        patient: vm.patient,
                        selectedAdmit: selectedAdmit
                    };
                }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
            $log.info('Patient/Admit Info modal dismissed at: ' + new Date());
        });
    }

    function openOutcomesReport() {
        var selectedAdmit = angular.copy(vm.currentAdmit);
        vm.patientReportAudit();
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'outcomesReportComponent',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        patient: vm.patient,
                        selectedAdmit: selectedAdmit
                    };
                }
            }
        });
        modalInstance.result.then(function () {
        }, function () {
            $log.info('Patient/Admit Info modal dismissed at: ' + new Date());
        });
    }

    function patientReportAudit(){
        var auditdetail = {}
        auditdetail.username = $rootScope.globals.currentUser.username;
        auditdetail.action =  "PATIENTREPORT";
        auditdetail.accessType = "VIEW";
        auditdetail.accessRecord = vm.patient.lastNm + "," + vm.patient.firstNm;
        auditdetail.patientEmpi = vm.patient.empi;
        auditdetail.admitId = 0;
        auditdetail.targetURL = $location.absUrl();
        auditdetail.comment = "Viewing the Patient Report";
        auditservice.sendAudit(auditdetail)
            .then(function (data) {});

    }

    function openOutcomeModal(survey) {
        var surveyCopy = angular.copy(survey);
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'outcomesComponent',
            backdrop: 'static',
            windowClass: 'outcomes-modal-without-calculator',
            resolve: {
                items: function () {
                    return {
                        patientId: vm.patient.patientId,
                        admitId: vm.admitId,
                        survey: surveyCopy
                    };
                }
            }
        });

        modalInstance.result.then(function (admitId) {
           getOutcomes();
        }, function () {
            $log.info('outcome modal dismissed at: ' + new Date());
        });
    }

    function openESurveyModal() {
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'esurveyComponent',
            size: 'md',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        patientId: vm.patient.patientId,
                        admitId: vm.admitId
                    };
                }
            }
        });

        modalInstance.result.then(function () {
        }, function () {
            $log.info('eSurvey modal dismissed at: ' + new Date());
        });
    }

    $rootScope.$on('refreshOutcomesEvent', function (event) {
        $log.info('refreshing outcomes');
       getOutcomes();
    });

    function openClassificationModal(classification) {
        var classificationCopy = angular.copy(classification);
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'classificationComponent',
            windowClass: 'classification-modal',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        classification: classificationCopy,
                        admitId: vm.admitId
                    };
                }
            }
        });
    //function sortClassificationDefinitions(ClassificationDefinitions){
        //var x = angular.copy(ClassificationDefinitions);
        //var y = 1;
        //var z = x + y;
        //return z;
   // }

        modalInstance.result.then(function (admitId) {
            //refresh data
            vm.displayDetails(vm.patient.patientId);
        }, function () {
            $log.info('classification modal dismissed at: ' + new Date());
        });
    }

    function openSurveyResponses(survey){
        var surveyCopy = angular.copy(survey);
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'responsesComponent',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        survey: surveyCopy,
                        admitId: vm.admitId,
                        patient: vm.patient
                    };
                }
            }
        });

        modalInstance.result.then(function (admitId) {
            getOutcomes();
        }, function () {
            $log.info('Responses results modal dismissed at: ' + new Date());
        });
    }

    function openDischargeModal(admit) {
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'dischargeComponent',
            windowClass: 'discharge-modal',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        admit: admit,
                        patient: vm.patient
                    };
                }
            }
        });

        modalInstance.result.then(function (admitId) {
            //refresh data
            vm.displayDetails(vm.patient.patientId);
        }, function () {
            $log.info('discharge modal dismissed at: ' + new Date());
        });
    }
    
    //Active and Discharge patient radio button click to trigger the search box click event to display the patient search results.
    function triggerSearchPatient(){
    	angular.element('input.patient-search-input').trigger('click');	
    } 
}