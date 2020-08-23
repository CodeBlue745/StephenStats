/**
 * Created by skatrag1 on 10/27/2016.
 */

'use strict';

angular.module('roms.discharge', ['roms.datepicker']).component('dischargeComponent', {
    templateUrl: 'scripts/components/discharge/discharge.template.html',
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controller: DischargeComponentController
});

DischargeComponentController.$inject = ['$rootScope', '$moment', 'patientservice'];

function DischargeComponentController($rootScope, $moment, patientservice) {

    var ctrl = this;
    var msprId = -1;
    
    if($rootScope.globals !== undefined && $rootScope.globals.currentUser !== undefined && $rootScope.globals.currentUser.msprId !== undefined){
        msprId = Number($rootScope.globals.currentUser.msprId);
    }

    ctrl.cancel = cancel;
    ctrl.dischargePatient = dischargePatient;
    ctrl.deleteDischarge = deleteDischarge;
    ctrl.reset = reset;
    ctrl.discharge = {};
    ctrl.discharge.dischargeDate = new Date();
    ctrl.admitDate = new Date();

    if (ctrl.resolve.items && ctrl.resolve.items.patient && ctrl.resolve.items.admit) {
        var selectedPatient = ctrl.resolve.items.patient;
        var selectedAdmit = ctrl.resolve.items.admit;
        ctrl.selectedAdmit = selectedAdmit;

        ctrl.patient = {};
        ctrl.patient.patientName = selectedPatient.lastNm + ', ' + selectedPatient.firstNm;
        ctrl.patient.dateOfBirth = selectedPatient.birthDtStr;
        ctrl.patient.admitDate = selectedAdmit.admitDt;
        ctrl.admitDate = $moment(ctrl.patient.admitDate, 'MM/DD/YYYY')._d;
        if(selectedAdmit.dischargeDate !== null) {
            ctrl.discharge.dischargeDate = $moment(selectedAdmit.dischargeDate, 'MM/DD/YYYY')._d;
        }
        if(selectedAdmit.dischargeDate !== null && selectedAdmit.visitCount >= 0) {
            ctrl.discharge.visitCount = selectedAdmit.visitCount;
        }

        if(selectedAdmit.dischargeDate !== null && selectedAdmit.totalChargeAmount >= 0) {
            ctrl.discharge.totalCharges = selectedAdmit.totalChargeAmount;
        }
    }

    ctrl.dischargeDateOptions = {
        formatYear: 'yy',
        maxDate: new Date(),
        minDate: ctrl.admitDate,
        startingDay: 1
    };
    
    function cancel() {
        ctrl.dismiss({$value: 'cancel'});
    }

    function dischargePatient() {
        var isDischargeDateValid = $moment(ctrl.discharge.dischargeDate, 'MM/DD/YYYY', true).isValid();

        if (isDischargeDateValid){
            var minDate = $moment(ctrl.admitDate, 'MM/DD/YYYY', true);
            var maxDate = $moment(new Date(), 'MM/DD/YYYY', true);
            var selectedDate = $moment(ctrl.discharge.dischargeDate, 'MM/DD/YYYY', true);
            
            if (minDate > selectedDate || selectedDate > maxDate) {
                isDischargeDateValid = false;
                ctrl.form.dischargeDate.$error.date = true;
            } 
            
            if (isDischargeDateValid){
            var discharge = {};
            discharge.admitId = ctrl.resolve.items.admit.admitId;
            discharge.dischargeDate = ctrl.discharge.dischargeDate;
            discharge.visitCount = 0;
            discharge.totalCharges = 0; 
            patientservice.dischargePatient(discharge, msprId).then(function (data) {
                ctrl.close({$value: data});
            });
            }
        }
    }

    function deleteDischarge(){
        var discharge = {};
        discharge.admitId = ctrl.resolve.items.admit.admitId;
        discharge.dischargeDate = ctrl.discharge.dischargeDate;
        discharge.visitCount = ctrl.discharge.visitCount;
        discharge.totalCharges = ctrl.discharge.totalCharges;
        patientservice.deleteDischarge(discharge, msprId).then(function (data) {
            ctrl.close({$value: data});
        });
    }

    function reset() {

        if (ctrl.form) {
            ctrl.form.$setPristine();
            ctrl.form.$setUntouched();
        }
        ctrl.discharge = {};
        ctrl.discharge.dischargeDate = new Date();
    }
}
