(function () {
    var FormClass = afw.BasePanel.extend({
        GetType: function () {
            return crm.DailyCalendar_CurrentTimeIndicatorControl;
        },

        init: function (options) {
            var that = this;

            afw.BasePanel.fn.init.call(that, options);
            var designObjectData = afw.uiApi.GetControlDesignObjectDataByName(that.GetType().TypeName);
            afw.uiApi.CreateControlByObjectData(that, designObjectData, false);

            that._CurrentTimeIndicatorLine = new afw.Panel({
                ParentControl: that.ParentControl,
                Height: 1,
                Width: 100,
                BackColor: "#db0000"
            });

            that._Time = null;
        },

        SetTime: function (time) {
            var that = this;

            that._Time = time;

            var currentHourLabel = that.FindControl("CurrentHourLabel");
            currentHourLabel.SetText(time);
        },

        GetTime: function () {
            var that = this;

            return that._Time;
        },

        SetVisible: function (value) {
            var that = this;

            afw.BasePanel.fn.SetVisible.call(that, value);

            if (!ValueIsEmpty(that._CurrentTimeIndicatorLine)) {
                that._CurrentTimeIndicatorLine.SetVisible(value);
            }
        },

        SetLeft: function (value) {
            var that = this;

            afw.BasePanel.fn.SetLeft.call(that, value);

            that._AdjustControls();
        },

        SetTop: function (value) {
            var that = this;

            afw.BasePanel.fn.SetTop.call(that, value);

            that._AdjustControls();
        },

        _OnResize: function () {
            var that = this;

            afw.BasePanel.fn._OnResize.call(that);

            that._AdjustControls();
        },

        _AdjustControls: function () {
            var that = this;

            if (!ValueIsEmpty(that._CurrentTimeIndicatorLine)) {
                that._CurrentTimeIndicatorLine.SetPosition(that.GetLeft() + 50, that.GetTop() + 9);

                var width = that.ParentControl.GetWidth() - 50;
                if (width < 1)
                    width = 1;

                that._CurrentTimeIndicatorLine.SetWidth(width);
            }
        }
    });

    //Static Members:

    FormClass.TypeName = "crm.DailyCalendar_CurrentTimeIndicatorControl";
    FormClass.BaseType = afw.BasePanel;


    crm.DailyCalendar_CurrentTimeIndicatorControl = FormClass;
})();