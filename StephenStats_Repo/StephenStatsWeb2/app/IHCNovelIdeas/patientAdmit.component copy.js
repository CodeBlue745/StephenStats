/**
 * Created by ddromero on 02/05/2018.
 */

'use strict';

angular.module('roms.patientAdmit', ['ui.bootstrap']).component('patientAdmitComponent', {
    templateUrl: 'scripts/components/patientAdmit/patientAdmit.template.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controller: PatientAdmitController 
});

PatientAdmitController.$inject = ['$rootScope', '$scope', 'patientservice', '$moment',
'$uibModal', '$log', '$window', '$location', '$filter', 'departmentservice','facilityservice'];

function PatientAdmitController ($rootScope, $scope, patientservice, $moment, $uibModal, $log, $window,
    $location, $filter, departmentservice,facilityservice) {
    var vm = this;
    var msprId = -1;
    vm.showMessage = false;
    vm.getFacilities = getFacilities;
    vm.modalTitle = "New Patient/Admit";
    vm.editPatientFlag = false;
    vm.existingPatientFlag = false;
    vm.editAdmitFlag = false;
    vm.readmitFlag = false;
    vm.submitBtnDisabled = false;
    vm.physicianFormError = false;

    vm.empiChange = empiChange;
    vm.checkPatientExists = checkPatientExists;
    vm.readmit = readmit;
    vm.savePatientAndAdmit = savePatientAndAdmit;
    vm.updateObject = updateObject;
    vm.updateAdmit = updateAdmit;
    vm.updatePatient = updatePatient;
    vm.openDeleteAdmitModal = openDeleteAdmitModal;
    vm.deleteAdmit = deleteAdmit;
    vm.reset = reset;
    vm.cancel = cancel;
    vm.recentEncountersModal = recentEncountersModal;
    vm.checkPhysicianValid = checkPhysicianValid;
    vm.checkTherapistValid = checkTherapistValid;
    vm.getDepartments = getDepartments;
    vm.selectedAdmit = {};
    vm.results = {};
    vm.patients = {};
    $rootScope.addAll = false;

    if($rootScope.globals !== undefined && $rootScope.globals.currentUser !== undefined && $rootScope.globals.currentUser.msprId !== undefined){
        msprId = Number($rootScope.globals.currentUser.msprId);
    }

    vm.$onInit = function () {

        vm.patient = vm.resolve.items.patient;
        vm.patients = vm.resolve.items.patients;
        vm.editPatientFlag = vm.resolve.items.flags.editPatientFlag;
        vm.editAdmitFlag = vm.resolve.items.flags.editAdmitFlag;
        vm.readmitFlag = vm.resolve.items.flags.readmitFlag;
        vm.patient.admDate = new Date();

        if(vm.editPatientFlag){
            vm.modalTitle = "Edit Patient";
        } else if(vm.editAdmitFlag){
            vm.modalTitle = "Edit Admit";
            vm.selectedAdmit = vm.resolve.items.selectedAdmit;
            vm.patient.admitId = vm.selectedAdmit.admitId;
            vm.patient.admDate = $moment(vm.selectedAdmit.admitDt, 'MM/DD/YYYY')._d;
            if (vm.selectedAdmit.acctNo > 0) {
                vm.patient.accountNo = vm.selectedAdmit.acctNo;
            }else {
                vm.patient.accountNo = '';
            }           
            vm.patient.facility = vm.selectedAdmit.facilityId;   
            vm.getDepartments(vm.selectedAdmit.facilityId);           
            vm.patient.department = vm.selectedAdmit.appDeptId;
           
            if(vm.selectedAdmit.therapistPrvdrId !== null){
            	vm.patient.treatingTherapist = {id:vm.selectedAdmit.therapistPrvdrId,label:vm.selectedAdmit.therapistName};            	
            }
            if(vm.selectedAdmit.referringPhysician !== null) {
                vm.patient.referringPhysicianObject = {id: vm.selectedAdmit.referringPhysician.providerId,
                    name: vm.selectedAdmit.referringPhysician.lastName + ', ' +  vm.selectedAdmit.referringPhysician.firstName + ' (' +
                    vm.selectedAdmit.referringPhysician.primarySpeciality + ', ' + vm.selectedAdmit.referringPhysician.providerId + ')'};
            }
            vm.patient.insuranceType = vm.selectedAdmit.insuranceType;
            vm.patient.providerName = vm.selectedAdmit.providerName;
            // ED Referral change
            vm.patient.edReferCd = vm.selectedAdmit.edRefer;
            vm.patient.edfacility = vm.selectedAdmit.edFacilityId;
        } else if(vm.readmitFlag){
            vm.modalTitle = "ReAdmit Patient";
            vm.patient.admDate = new Date();
            vm.patient.facility = '';
            vm.patient.department = '';            
            vm.patient.treatingTherapist = '';
            vm.patient.referringPhysician= '';
            vm.patient.referringPhysicianObject = null;
            vm.patient.insuranceType = '';
            vm.patient.accountNo = '';
            
        } 
        getFacilities();
      };
      
      function getFacilities() {
          facilityservice.getFacilities().then(function (data) {
              var facilities = [];
              var nonEDFacilities =[124,109,366,568,138,270,185,370];
              // Needed for Patient Volumes Report 'All Departments' option 
              if($rootScope.addAll === true) {
                  var allOption = {
                      id: -1,
                      label: 'All Facilities'
                  };
                  facilities.push(allOption);
              }

              if(data !== undefined) {
                  for (var i = 0; i < data.length; i++) {
                      var f = data[i];
                     
                      if(! nonEDFacilities.includes(f.facilityId)){
                      var facility = {
                          id: f.facilityId,                      
                          label: f.facilityDepartmentName
                      };
                      facilities.push(facility);
                  }
                  }
                 
                  $rootScope.facilitiesList = facilities;
              }
              vm.facilities = facilities;
          });
          
      }
      

    function checkPatientExists() {
        if (vm.patient.empi !== undefined && vm.patient.empi !== '' && !isNaN(vm.patient.empi)) {
            patientservice.getPatientByEMPI(vm.patient.empi)
                .then(function (data) {
                    if (data !== undefined) {
                        vm.existingPatientFlag = true;
                        if(!vm.editPatientFlag) {
                            vm.patient = data;
                            vm.patient.birthDt = $moment(vm.patient.birthDtStr, 'MM/DD/YYYY')._d;
                            //vm.patient.admDate = new Date();
                            vm.recentEncountersModal(data.admits);
                        	
                            if(vm.patient.patientId == 0){
                            	vm.adtPatient = true;
                            	vm.editPatientFlag = false;
                            	vm.submitBtnDisabled = false;
                            }else{
                            	vm.adtPatient = false;
                            }
                        }
                    } else {
                        if(!vm.editPatientFlag) { // do not clear fields if editing a patient
                        	
                        	if (vm.form) {
                                vm.form.$setPristine();
                                vm.form.$setUntouched();
                            }
                        	
                            vm.existingPatientFlag = false;
                            vm.patient.firstNm = '';
                            vm.patient.lastNm = '';
                            vm.patient.birthDt = '';
                            vm.patient.sexCd = '';
                            
                            vm.patient.accountNo = '';
                            vm.patient.facility = '';
                            vm.patient.treatingTherapist = '';
                            vm.patient.referringPhysician= '';
                            vm.patient.edRefer='';
                            vm.patient.edfacility='';
                        }
                    }
                });
        }
    }

    function empiChange() {
        if (vm.patient.empi === undefined || vm.patient.empi === '') {
            vm.existingPatientFlag = false;
            vm.patient = {};
            vm.patient.admDate = new Date();
        }
    }

    function savePatientAndAdmit() {
        vm.submitBtnDisabled = true;
        if (vm.editPatientFlag) {
            // update patient info only
            if (vm.form.$valid && checkDateValid(vm.form)) {
                vm.updatePatient();
            }else {
                vm.submitBtnDisabled = false;
            }
        } else if (vm.editAdmitFlag) {
            // update admit info only
            if (vm.form.$valid && checkDateValid(vm.form) && checkAccountNoValid() && checkPhysicianValid() && checkTherapistValid()) {
                vm.updateAdmit();
            }else {
                vm.submitBtnDisabled = false; 
            }
        }
        else {
            
            // save both patient and admit info
            if (vm.form.$valid && checkDateValid(vm.form) && checkAccountNoValid() && checkPhysicianValid() && checkTherapistValid()) {        	
                var birthDateFormatted = $moment(vm.patient.birthDt).format('YYYY-MM-DD');
                var admitDateFormatted = $moment(vm.patient.admDate).format('YYYY-MM-DD');
                var newPatient = {};
                newPatient.firstNm = vm.patient.firstNm;
                newPatient.lastNm = vm.patient.lastNm;
                newPatient.birthDtStr = birthDateFormatted;
                newPatient.sexCd = vm.patient.sexCd;
                newPatient.empi = vm.patient.empi;
                newPatient.edRefer = vm.patient.edReferCd;
                newPatient.edFacilityId = vm.patient.edfacility;
                
                var newAdmit = {};                
                newAdmit.appDeptId = vm.patient.department;               
                newAdmit.therapistPrvdrId = vm.patient.treatingTherapist.id;                
                newAdmit.refrngPrvdrId = vm.patient.referringPhysicianObject.id;
                newAdmit.insuranceType = vm.patient.insuranceType;
                newAdmit.admitDt = admitDateFormatted;
                newAdmit.acctNo = vm.patient.accountNo;
                newAdmit.providerName = vm.patient.providerName;
                newAdmit.facilityId = vm.patient.facility;
                newAdmit.edRefer = vm.patient.edReferCd;
                newAdmit.edFacilityId = vm.patient.edfacility;

                
                var patientAdmit = {};
                patientAdmit.patient = newPatient;
                patientAdmit.admit = newAdmit;     
                
                patientservice.savePatientAdmit(patientAdmit, msprId)
                    .then(function (data) {
                        vm.patient = data.patient;
                        vm.admitId = data.admitId;
                        for (var i = 0; i < vm.patient.admits.length; i++) {
                            if (vm.patient.admits[i].admitId === vm.admitId) {
                                vm.surveys = vm.patient.admits[i].surveys;
                                break;
                            }
                        }
                        vm.patient.birthDt = $moment(vm.patient.birthDtStr, 'MM/DD/YYYY')._d;
                        vm.results = {patientId: vm.patient.patientId};
                        vm.close({$value: vm.results});
                    });
            }else {
                vm.submitBtnDisabled = false;
            }
        }
    }

    function updateObject(patient, prop, value) {
        vm.patient[prop] = value;
    }

    function updatePatient() {
        var birthDateFormatted = $moment(vm.patient.birthDt).format('YYYY-MM-DD');
        var newPatient = {};
        newPatient.firstNm = vm.patient.firstNm;
        newPatient.lastNm = vm.patient.lastNm;
        newPatient.birthDtStr = birthDateFormatted;
        newPatient.sexCd = vm.patient.sexCd;
        newPatient.empi = vm.patient.empi;
        newPatient.patientId = vm.patient.patientId;
        newPatient.edRefer = vm.patient.edRefer;
        newPatient.edfacility = vm.patient.edfacility;

        patientservice.updatePatient(newPatient, msprId)
            .then(function (data) {
                vm.patient.birthDtStr = $moment(vm.patient.birthDt).format('MM/DD/YYYY');
                // to display updated info in patient search screen
                for (var i = 0; i < vm.patients.length; i++) {
                    if (vm.patients[i].patientId === vm.patient.patientId) {
                        vm.patients[i] = vm.patient;
                        break;
                    }
                }
                vm.results = {patientId: vm.patient.patientId};
                vm.close({$value: vm.results});
            });
    }

    function updateAdmit() {
        var newAdmit = {};
        var admitDateFormatted = $moment(vm.patient.admDate).format('YYYY-MM-DD');
        newAdmit.admitId = vm.selectedAdmit.admitId;
        newAdmit.appDeptId = vm.patient.department;
        newAdmit.facilityId = vm.patient.facility;
        newAdmit.therapistPrvdrId = vm.patient.treatingTherapist.id;
        newAdmit.refrngPrvdrId = vm.patient.referringPhysicianObject.id;
        newAdmit.admitDt = admitDateFormatted;
        newAdmit.acctNo = vm.patient.accountNo;
        newAdmit.insuranceType = vm.patient.insuranceType;
        newAdmit.providerName = vm.patient.providerName;
        newAdmit.edRefer = vm.patient.edReferCd;
        newAdmit.edFacilityId = vm.patient.edfacility;
        patientservice.updateAdmit(vm.patient.patientId, newAdmit, msprId)
            .then(function (data) {
                vm.results = {patientId: vm.patient.patientId};
                vm.close({$value: vm.results});
            });
    }
    ///checkBirthDateValid() throws an error if incorrect values are entered for selectedBirthDate and selectedAdmitDate.
    function checkDateValid() {
        var result = $moment(vm.patient.birthDt, 'MM/DD/YYYY', true).isValid();
        if (result) {
            var invalidBirthDate = new Date(1900, 0, 1); // 01/Jan/1900 is used as min invalid date
            var invalidAdmitDate = new Date(2000, 0, 1); // 01/Jan/2000 is used as min invalid date
            var selectedAdmitDate = $moment(vm.patient.admDate, 'MM/DD/YYYY', true);
            var selectedAdmitDate = $moment(vm.patient.admDate, 'MM/DD/YYYY', true);
            var selectedBirthDate = $moment(vm.patient.birthDt, 'MM/DD/YYYY', true);
            if(selectedBirthDate < invalidBirthDate || selectedBirthDate > new Date()){
                vm.form.birthDate.$error.date = true;
                return false;
            }
            if (selectedAdmitDate < invalidAdmitDate || selectedAdmitDate > new Date()) {
                vm.form.admDate.$error.date = true;
                return false;
                }
            if (selectedBirthDate > selectedAdmitDate){
            	vm.form.birthDate.$error.date = true;
            	vm.form.admDate.$error.date = true;
            	return false;
            }
            else{
            	return true;
            	}
            }
        
        else{
        	return true;
        }
    }

    function checkAccountNoValid(){
        if(vm.patient.accountNo === undefined){
            return false;
        }
        if(vm.patient.accountNo > 0 ){
            if(vm.patient.accountNo > 999999999999){
                return false;
            }
        }
        return true;
    }

    function checkPhysicianValid() {
        if (vm.patient.referringPhysicianObject === undefined) {
            vm.physicianFormError = true;
            return false;
        } else {
            if (vm.patient.referringPhysicianObject.id === undefined) {
                vm.physicianFormError = true;
                return false;
            } else {
                vm.physicianFormError = false;
                return true;
            }
        }
    }
    
    function checkTherapistValid() {
        if (vm.patient.treatingTherapist === undefined) {
            vm.therpistFormError = true;
            return false;
        } else {
            if (vm.patient.treatingTherapist.id === undefined) {
                vm.therpistFormError = true;
                return false;
            } else {
                vm.therpistFormError = false;
                return true;
            }
        }
    }

    function readmit() {
        vm.existingPatientFlag = false;
        vm.modalTitle = "ReAdmit Patient";        
        vm.readmitFlag = true;      
        if (vm.form) {
            vm.form.$setPristine();
            vm.form.$setUntouched();
        }
    }

    function reset() {
        if (vm.form) {
            vm.form.$setPristine();
            vm.form.$setUntouched();
        }
        vm.patient = {};
    }

    function openDeleteAdmitModal(admitId) {
        vm.modalText = 'admit';
        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'alertComponent',
            windowClass: 'delete-modal',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                        modalText: vm.modalText
                    };
                }
            }
        });

        modalInstance.result.then(function (result) {
            if(result){
                vm.deleteAdmit(admitId);
            }
        }, function () {
            $log.info('Alert modal dismissed at: ' + new Date());
        });
    }

    function deleteAdmit(admitId) {
        patientservice.deleteAdmit(vm.patient.patientId, admitId, msprId)
            .then(function (data) {
                //refresh data
                vm.results = {patientId: vm.patient.patientId}
                vm.close({$value: vm.results});
            });
    }

    //Dismisses the alert modal window. 
    function cancel() {
        vm.dismiss({$value: 'cancel'});
    }
    
    //Open recent encounters modal
    function recentEncountersModal(encounters) {

        var modalInstance = $uibModal.open({
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            component: 'recentEncounters',
            size: 'lg',
            backdrop: 'static',
            resolve: {
                items: function () {
                    return {
                    	patient: vm.patient,
                        recentEncounters : encounters
                    };
                }
            }
        });

        modalInstance.result.then(function () {
        }, function () {
        	$log.info('Recent encounters modal dismissed at: ' + new Date());
        });
    }
    
    function getDepartments(faciltySelecteditem){		
		var fciltyId = faciltySelecteditem ;
		departmentservice.getDepartmentByFciltyId(fciltyId).then(function (data) {
            var departments = [];        

            if(data !== undefined) {
                for (var i = 0; i < data.length; i++) {
                    var f = data[i];
                    var department = {
                        id: f.departmentId,                      
                        label: f.departmentName
                    };
                    departments.push(department);
                }
                $rootScope.departmentList = departments;
            }            
            vm.patient.departments = departments;
        });
        
	}

}