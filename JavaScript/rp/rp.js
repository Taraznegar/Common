(function () {
    window.rp = {
        Init: function () {
            var that = this;

            that._ReceiveTypesEntityList = null;
            that._ReceiveTypeOpKindsEntityList = null;

            that._PayTypesEntityList = null;
            that._PayTypeOpKindsEntityList = null;
        },

        GetReceiveTypesEntityList: function () {
            var that = this;

            if (that._ReceiveTypesEntityList == null)
                that._ReceiveTypesEntityList = afw.uiApi.FetchEntityList("rp.ReceiveType");

            return that._ReceiveTypesEntityList;
        },

        GetReceiveTypeOpKindsEntityList: function () {
            var that = this;

            if (that._ReceiveTypeOpKindsEntityList == null)
                that._ReceiveTypeOpKindsEntityList = afw.uiApi.FetchEntityList("rp.ReceiveTypeOpKind");

            return that._ReceiveTypeOpKindsEntityList;
        },

        GetReceiveTypeName: function (id) {
            var that = this;

            var receiveTypes = that.GetReceiveTypesEntityList().Entities;
            var foundReceiveTypes = $.grep(receiveTypes,
                function (o) { return o.GetFieldValue("ID").toLowerCase() === id.toLowerCase(); });
            if (foundReceiveTypes.length == 1)
                return foundReceiveTypes[0].GetFieldValue("Name");
            else
                throw "Invalid ReceiveType ID";
        },

        GetReceiveTypeID: function (name) {
            var that = this;

            var receiveTypes = that.GetReceiveTypesEntityList().Entities;
            var foundReceiveTypes = $.grep(receiveTypes, function (o) { return o.GetFieldValue("Name") === name; });
            if (foundReceiveTypes.length == 1)
                return foundReceiveTypes[0].GetFieldValue("ID");
            else
                throw "Invalid ReceiveType Name";
        },

        GetPayTypesEntityList: function () {
            var that = this;

            if (that._PayTypesEntityList == null)
                that._PayTypesEntityList = afw.uiApi.FetchEntityList("rp.PayType");

            return that._PayTypesEntityList;
        },

        GetPayTypeOpKindsEntityList: function () {
            var that = this;

            if (that._PayTypeOpKindsEntityList == null)
                that._PayTypeOpKindsEntityList = afw.uiApi.FetchEntityList("rp.PayTypeOpKind");

            return that._PayTypeOpKindsEntityList;
        },

        GetPayTypeName: function (id) {
            var that = this;

            var payTypes = that.GetPayTypesEntityList().Entities;
            var foundPayTypes = $.grep(payTypes,
                function (o) { return o.GetFieldValue("ID").toLowerCase() === id.toLowerCase(); });
            if (foundPayTypes.length == 1)
                return foundPayTypes[0].GetFieldValue("Name");
            else
                throw "Invalid PayType ID";
        },

        GetPayTypeID: function (name) {
            var that = this;

            var payTypes = that.GetPayTypesEntityList().Entities;
            var foundPayTypes = $.grep(payTypes, function (o) { return o.GetFieldValue("Name") === name; });
            if (foundPayTypes.length == 1)
                return foundPayTypes[0].GetFieldValue("ID");
            else
                throw "Invalid PayType Name";
        },

        OpenNewReceiveReceiptForm: function () {
            var that = this;

            var receiveReceiptEntity = afw.uiApi.CreateNewEntity("rp.ReceiveReceipt")

            if (cmn.OpenWindowExists())
                customerWindow = afw.EntityHelper.OpenEntityFormInWindow(receiveReceiptEntity, "rp.ReceiveReceiptEditForm", "New");
            else
                customerWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(receiveReceiptEntity, "rp.ReceiveReceiptEditForm", "New");
        },

        OpenNewPayReceiptForm: function () {
            var that = this;

            var payReceiptEntity = afw.uiApi.CreateNewEntity("rp.PayReceipt")

            if (cmn.OpenWindowExists())
                customerWindow = afw.EntityHelper.OpenEntityFormInWindow(payReceiptEntity, "rp.PayReceiptEditForm", "New");
            else
                customerWindow = afw.EntityHelper.OpenEntityFormInMdiContainer(payReceiptEntity, "rp.PayReceiptEditForm", "New");
        },

        OpenReceiveReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("rp.ReceiveReportForm", "گزارش دریافت");
        },

        OpenPayReportForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("rp.PayReportForm", "گزارش پرداخت");
        },

        OpenChequesStatusChangeSearchForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("rp.ChequesStatusChangeSearchForm", "تغییر وضعیت چک ها");
        },

        OpenReceivedChequeHistoryCheckForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("rp.ReceivedChequeHistoryCheckForm", "بررسی سابقه چک دریافتی");
        },

        OpenPaidChequeHistoryCheckForm: function () {
            var that = this;

            afw.uiApi.OpenSavedFormInMdiContainer("rp.PaidChequeHistoryCheckForm", "بررسی سابقه چک پرداختی");
        }

    }
})();