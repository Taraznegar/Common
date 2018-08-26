(function () {
    var FormClass = afw.EntityWindowBase.extend({
        GetType: function () {
            return wm.GhabzOrHavaleEditForm;
        },

        init: function (options) {
            var that = this;

            afw.EntityWindowBase.fn.init.call(that, options);

            that.WarehouseDocTypeName = options.WarehouseDocTypeName;
            if (ValueIsEmpty(that.WarehouseDocTypeName))
                that.WarehouseDocTypeName = "Havale"

            var warehouseDocType_PersionText = that.WarehouseDocTypeName == "Ghabz" ? "قبض" : "حواله";
            that.WarehouseDocTypeID = afw.OptionSetHelper.GetOptionSetItemID("cmn.WarehouseDocType." + that.WarehouseDocTypeName);

            that._FormEntity = formEntity = options.Entity;
            that.GhabzOrHavaleTypeEntity = null;

            that.SetTitle(warehouseDocType_PersionText + " انبار");
            that._MainTabControl = that.FindControl("MainTabControl");
            that._HeaderDockPanel = that.FindControl("HeaderDockPanel");
            that._MainDockPanel = that.FindControl("MainDockPanel");
            that._OuterPanel = that.FindControl("OuterPanel");
            that._InnerPanel = that.FindControl("InnerPanel");
            that._WarehouseKeeperNotesTextBox = that.FindControl("WarehouseKeeperNotesTextBox");
            that._HideShowHeaderControlDockPanel = that.FindControl("HideShowHeaderControlDockPanel");

            that._WarehouseKeeperNotesTextBox.SetVisible(false);
            that._HideShowHeaderControlDockPanel.SetMouseCursor("pointer");
            that._HideShowHeaderControlDockPanel.bind("Click", function (e) { that._HideShowHeaderControlDockPanel_Click(e); });

            that.IsGridMode = true;           
            if (that._FormMode == "Edit") {
                var itemsCount = afw.uiApi.GetEntityCount("wm.GhabzOrHavaleItem",
                    String.Format("GhabzOrHavale = '{0}'", that._BindableEntity.get("ID")));

                if (itemsCount > 15)
                    that.IsGridMode = false;
            }

            that._HeaderControlVisible = true;
            that._HasReferenceDoc = false;
            that.ItemsEntityList = null;
            that._ActiveFinancialYearID = cmn.GetUserActiveFinancialYearID();
            that.BatchList = afw.DataListHelper.FetchEntityListOfDataList("wm.BatchList").ToDataSourceData();
            that._ReferenceDocTypes = afw.uiApi.FetchEntityList("wm.ReferenceDocType", null, null).Entities;
            that.StuffStatusEntityList = afw.uiApi.FetchEntityList("wm.StuffStatus", null, "DisplayeOrder");
            that._ItemsGridControl = null;
            that._GeneralFieldsTabularPanel = null;
            that.GhabzOrHavaleTitle_TabularPanel = null;

            that.FetchedStuffs = [];

            that.GhabzOrHavaleTitle_TabularPanel = new afw.TabularPanel(
                {
                    ParentControl: that._HeaderDockPanel.Panes[1],
                    Name: "GhabzOrHavaleTitle",
                    TypeName: "afw.TabularPanel",
                    ColumnsCount: 4,
                    RightToLeft: true,
                    FillParent: true
                });

            that.GhabzOrHavaleTitle_TabularPanel.CreateFullCellRow(0);

            that._GhabzOrHavaleTypeDropDownList = that._CreateDropDownList(that.GhabzOrHavaleTitle_TabularPanel.GetRowAtIndex(0).GetCellByColumnIndex(0), "GhabzOrHavaleType",
                "wm.GhabzOrHavaleTypeList", "Title", "ID", "نوع " + warehouseDocType_PersionText + "",
                String.Format("WarehouseDocType = '{0}'", that.WarehouseDocTypeID));

            that._GhabzOrHavaleNumberTextBox = that._CreateTextBox(that.GhabzOrHavaleTitle_TabularPanel.GetRowAtIndex(0).GetCellByColumnIndex(1),
                "GhabzOrHavaleNumber", "شماره " + warehouseDocType_PersionText + "");

            that._IssueDateControl = that._CreateDateTimeControl(that.GhabzOrHavaleTitle_TabularPanel.GetRowAtIndex(0).GetCellByColumnIndex(2),
                "IssueDate", "تاریخ صدور", "Date");

            that._MainTabControl.GetTabPageByIndex(0).SetTabItemText(warehouseDocType_PersionText);

            that._CanChangeManualRialiAmount = afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar")
                && that._BindableEntity.get("ForceManualRiali");

            if (!ValueIsEmpty(that._BindableEntity.get("GhabzOrHavaleType")))
                that.GhabzOrHavaleTypeEntity = afw.uiApi.FetchEntityByID("wm.GhabzOrHavaleType",
                    that._BindableEntity.get("GhabzOrHavaleType"));

            if (that.IsGridMode) {
                if (!formEntity.FieldExists("GhabzOrHavaleItems"))
                    formEntity.AddField("GhabzOrHavaleItems", null);

                if (that._FormMode == "New" && formEntity.GetFieldValue("ReferenceDocType") != null)
                    that._GenerateGhabzOrHavaleItemsByRefDoc();
                else if (formEntity.GetFieldValue("GhabzOrHavaleItems") != null)
                    that.ItemsEntityList = formEntity.GetFieldValue("GhabzOrHavaleItems");
                else if (that._FormMode == "New") {
                    that.ItemsEntityList = afw.uiApi.CreateEntityList("wm.GhabzOrHavaleItem");
                    formEntity.SetFieldValue("GhabzOrHavaleItems", that.ItemsEntityList);
                }
                else if (that._FormMode == "Edit") {
                    that.ItemsEntityList = afw.uiApi.FetchEntityList("wm.GhabzOrHavaleItem",
                        String.Format("GhabzOrHavale = '{0}'", that._BindableEntity.get("ID")), "RowNumber", null, null, ["Stuff.StuffDef"]);
                    formEntity.SetFieldValue("GhabzOrHavaleItems", that.ItemsEntityList);
                }
            }
            else {
                if (formEntity.FieldExists("GhabzOrHavaleItems"))
                    formEntity.RemoveField("GhabzOrHavaleItems");
            }

            that._CreateGhabzOrHavaleForm();

            if (that._FormMode == "New") {
                that._BindableEntity.set("FinancialYear", that._ActiveFinancialYearID);
            }

            that._AdjustForm();
        },

        _SetBindableEntityGeneralFieldsToNull: function () {
            var that = this

            that._BindableEntity.set("ReferenceDocType", null);
            that._BindableEntity.set("FinancialDocType", null);
            that._BindableEntity.set("RefDoc_BuyInvoice", null);
            that._BindableEntity.set("RefDoc_ReturnFromBuy", null);
            that._BindableEntity.set("RefDoc_SalesInvoice", null);
            that._BindableEntity.set("RefDoc_ReturnFromSale", null);
            that._BindableEntity.set("RefDoc_InternalSefaresh", null);
            that._BindableEntity.set("RefDoc_ExternalSefaresh", null);
            that._BindableEntity.set("RefDoc_StuffStatusChangeAndTransfer", null);
            that._BindableEntity.set("RefDoc_GhetehBardariAzKala", null);
            that._BindableEntity.set("RefDoc_MontageOp", null);
            that._BindableEntity.set("RefDoc_DemontageOp", null);
            that._BindableEntity.set("StuffLocation", null);
            that._BindableEntity.set("TarafHesab_Person", null);
            that._BindableEntity.set("WareHouseDocRialiReference", null);
        },

        _GhabzOrHavaleTypeDropDownList_ValueChanged: function (e) {
            var that = this;

            that._HasReferenceDoc = false;
            that._SetBindableEntityGeneralFieldsToNull();
            that._DestroyGeneralItemTabularPanel();

            if (that._FormMode == "New") {
                if (ValueIsEmpty(that._ActiveOrgUnitID) || that._ActiveOrgUnitID.length != 1) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", that._ActiveOrgUnitID[0]);
            }

            if (!ValueIsEmpty(that._BindableEntity.get("GhabzOrHavaleType")))
                that.GhabzOrHavaleTypeEntity = afw.uiApi.FetchEntityByID("wm.GhabzOrHavaleType",
                    that._BindableEntity.get("GhabzOrHavaleType"));
            else
                that.GhabzOrHavaleTypeEntity = null;

            if (that.IsGridMode && that._ItemsGridControl != null)
                that._DestroyGhabzOrHavaleItemsGridControl();

            that._CreateGhabzOrHavaleForm();

            that._GhabzOrHavaleNumberTextBox.SetText(null);

            if (!ValueIsEmpty(that._StuffLocationDropDownList) && that._FormMode == "New")
                that._StuffLocationDropDownList.SetValue(wm.GetDefaultSourceStuffLocation());

            that._AdjustForm();

            if (ValueIsIn(that.GhabzOrHavaleTypeEntity.GetFieldValue("NahveRialiNemodan"),
                [afw.OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan.SanadReference"),
                    afw.OptionSetHelper.GetOptionSetItemID("wm.NahveRialiNemodan.SarjameReference")])) {
                that._AdjustRialiReferenceLookup();
                that._ResetRialiReferenceLookupValue();
            }
        },

        _CreateGhabzOrHavaleForm: function () {
            var that = this;

            if (ValueIsEmpty(that._BindableEntity.get("GhabzOrHavaleType")))
                return;

            that._BindableEntity.set("ReferenceDocType", that.GhabzOrHavaleTypeEntity.GetFieldValue("ReferenceDocType"));

            that._CreateGeneralItems();

            if (that.IsGridMode)
                that._CreateItemsGridControl();
            else
                that._CreateItemsDataList();

        },

        _CreateGeneralItems: function () {
            var that = this;

            if (!that._HeaderDockPanel.Panes[2].HasChildControls)
                that._GeneralFieldsTabularPanel =
                    new afw.TabularPanel({
                        ParentControl: that._HeaderDockPanel.Panes[2],
                        Name: "GeneralFieldsTabularPanel",
                        TypeName: "afw.TabularPanel",
                        ColumnsCount: 4,
                        RightToLeft: true,
                        FillParent: true
                    });

            var referenceDocTypeEntity = that._GetReferenceDocTypeEntity();
            var hasTaghirMablaghRialiAsnadAnbarPermission = afw.PermissionHelper.UserHasPermissionToItem("wm.TaghirMablaghRialiAsnadAnbar");

            that._GeneralFieldInfos = [
                {
                    Name: "ReferenceDoc", Title: "عملیات مرتبط",
                    Visible: !referenceDocTypeEntity.GetFieldValue("IsUserDefined")//فیلد عملیات مرتبط (لوک آپ) برای انواع غیر سیستمی دیده نمی شود
                        && that.GhabzOrHavaleTypeEntity.GetFieldValue("HasReferenceDoc") //فیلد عملیات مرتبط (لوک آپ) تنها در صورتی که 'عملیات مرتبط دارد' (نمایش فیلد عملیات مرتبط) در نوع سند تیک نخورده نمایش داده می شود
                        //دلیل فیلتر های بعدی مشخص نیست و باعث می شود برای این اسناد انبار عملیات مرتبط را نمایش ندهد که بنظر اشتباه می آید.!
                        //بنابراین کامنت شدند
                    //&& !(ValueIsIn(that.GhabzOrHavaleTypeEntity.GetFieldValue("Name"),
                        //        ["GhabzeKalahayeGhetehBardariShodeh", "GhabzeTaghirVaziateKalayeGhetehBardariShodeh",
                        //            "HavaleTaghirVaziateKalayeGhetehBardariShodeh", "HavaleKaheshArzesheKalayeGhetehBardariShodeh"])
                    //    || that.GhabzOrHavaleTypeEntity.GetFieldValue("Name") == "StuffStatusChangeAndTransferHavale"
                    //    || that.GhabzOrHavaleTypeEntity.GetFieldValue("Name") == "StuffStatusChangeAndTransferGhabz")
                    ,
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "ManualReferenceDocNumber", Title: "شماره " + referenceDocTypeEntity.GetFieldValue("Title"),
                    Visible: referenceDocTypeEntity.GetFieldValue("IsUserDefined")//در انواع غیر سیستمی همیشه 'شماره عملیات مرتبط' نمایش داده می شود
                        //اگر 'عملیات مرتبط دارد' (نمایش فیلد عملیات مرتبط) در نوع سند تیک نخورده 
                        //و نوع سند سیستمی است، 'شماره عملیات مرتبط' نمایش داده می شود:
                        || (!referenceDocTypeEntity.GetFieldValue("IsUserDefined")
                            && !that.GhabzOrHavaleTypeEntity.GetFieldValue("HasReferenceDoc")),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "TarafHesab_Person", Title: "شخص طرف حساب", Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("HasTarafHesab_Person"),
                    DataListFullName: "cmn.Persons", EntityCaptionFieldName: "FullName", DataValueField: "ID",
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },

                {
                    Name: "FinancialDocType", Title: "نوع سند مالی", Visible: true, OptionSetFullName: "cmn.FinancialDocType",
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },

                {
                    Name: "StuffLocation", Title: "انبار", Visible: true, DataListFullName: "cmn.StuffLocations", DataTextField: "Name", DataValueField: "ID",
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },

                {
                    Name: "WarehouseKeeperNotes", Title: "توضیحات انباردار", Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("HasWarehouseKeeperNotes"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_SendTime", Title: "زمان ارسال", Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasSendTime"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_SendType", Title: "نوع ارسال", Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasSendType"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_NameTahvilgirandehAzAnbar", Title: "نام تحویل گیرنده از انبار",
                    Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasNameTahvilgirandehAzAnbar"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_TelephoneTahvilgirandehAzAnbar", Title: "تلفن تحویل گیرنده از انبار",
                    Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasTelephoneTahvilgirandehAzAnbar"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_NameTahvilgirandehTarafMoshtari", Title: "نام تحویل گیرنده از طرف مشتری",
                    Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasNameTahvilgirandehTarafMoshtari"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_TelephoneTahvilgirandehTarafeMoshtari", Title: "تلفن تحویل گیرنده از طرف مشتری",
                    Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasTelephoneTahvilgirandehTarafeMoshtari"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "Havale_ShomarehBarnameh", Title: "شماره بارنامه",
                    Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("Havale_HasShomarehBarnameh"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "MasterBatchNumber", Title: "شماره بچ",
                    Visible: that.GhabzOrHavaleTypeEntity.GetFieldValue("MasterBatchNumber"),
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                },
                {
                    Name: "RialiAmountSum", Title: "سرجمع مبلغ ریالی",
                    Visible: hasTaghirMablaghRialiAsnadAnbarPermission && !that.IsGridMode,
                    IsReadOnly: true
                },
                {
                    Name: "WareHouseDocRialiReference", Title: "رفرنس ریالی " + (that.WarehouseDocTypeName == "Ghabz" ? "قبض" : "حواله"),
                    Visible: !ValueIsEmpty(that.GhabzOrHavaleTypeEntity.GetFieldValue("WareHouseDocRialiReferenceType")),
                    DataListFullName: "wm.GhabzOrHavalehaList", EntityCaptionFieldName: "CaptionText", DataValueField: "ID",
                    IsReadOnly: hasTaghirMablaghRialiAsnadAnbarPermission && that._FormMode != "New"
                }
            ];

            that.RowIndex = 0;
            var colIndex = 0;

            for (var generalFieldIndex = 0; generalFieldIndex < that._GeneralFieldInfos.length; generalFieldIndex++) {
                var generalFieldInfo = that._GeneralFieldInfos[generalFieldIndex];

                if (generalFieldInfo.Visible == true) {
                    if (that.RowIndex == 0 && colIndex == 0)
                        that._GeneralFieldsTabularPanel.CreateFullCellRow(that.RowIndex);

                    if (colIndex == 4) {
                        that.RowIndex++;
                        colIndex = 0;
                        that._GeneralFieldsTabularPanel.CreateFullCellRow(that.RowIndex);
                    }

                    var parentControl = that._GeneralFieldsTabularPanel.GetRowAtIndex(that.RowIndex).GetCellByColumnIndex(colIndex);

                    if (ValueIsIn(generalFieldInfo.Name, ["StuffLocation"])) {
                        that._CreateDropDownList(parentControl, generalFieldInfo.Name,
                            generalFieldInfo.DataListFullName, generalFieldInfo.DataTextField, generalFieldInfo.DataValueField, generalFieldInfo.Title, null);

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl(generalFieldInfo.Name + "DropDownList").SetReadOnly(true);
                    }
                    else if (ValueIsIn(generalFieldInfo.Name, ["FinancialDocType"])) {
                        that._CreateOptionSetControl(parentControl, generalFieldInfo.Name,
                            generalFieldInfo.OptionSetFullName, generalFieldInfo.Title);

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl(generalFieldInfo.Name + "DropDownList").SetReadOnly(true);
                    }
                    else if (generalFieldInfo.Name == "ReferenceDoc") {
                        that._CreateReferenceDocLookupControl(parentControl);
                        that._HasReferenceDoc = true;

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl("ReferenceDocLookupControl").SetReadOnly(true);
                    }
                    else if (generalFieldInfo.Name == "TarafHesab_Person") {
                        that._CreateLookupControl(parentControl, generalFieldInfo.Name,
                            generalFieldInfo.DataListFullName, generalFieldInfo.EntityCaptionFieldName, generalFieldInfo.Title);

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl(generalFieldInfo.Name + "LookupControl").SetReadOnly(true);
                    }
                    else if (ValueIsIn(generalFieldInfo.Name, ["Havale_SendType", "MasterBatchNumber",
                        "Havale_NameTahvilgirandehAzAnbar", "Havale_TelephoneTahvilgirandehAzAnbar", "Havale_ShomarehBarnameh",
                        "Havale_NameTahvilgirandehTarafMoshtari", "Havale_TelephoneTahvilgirandehTarafeMoshtari", "ManualReferenceDocNumber"])) {
                        that._CreateTextBox(parentControl, generalFieldInfo.Name, generalFieldInfo.Title);

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl(generalFieldInfo.Name + "TextBox").SetReadOnly(true);
                    }
                    else if (generalFieldInfo.Name == "Havale_SendTime") {
                        that._CreateDateTimeControl(parentControl, generalFieldInfo.Name, generalFieldInfo.Title, "DateAndTime");

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl(generalFieldInfo.Name + "DateTime").SetReadOnly(true);
                    }
                    else if (generalFieldInfo.Name == "RialiAmountSum") {
                        that._CreateNumericTextBox(parentControl, generalFieldInfo.Name, generalFieldInfo.Title);
                        that.RefreshRialiAmountSum();

                        if (generalFieldInfo.IsReadOnly)
                            that.FindControl(generalFieldInfo.Name + "NumericTextBox").SetReadOnly(true);
                    }
                    else if (generalFieldInfo.Name == "WarehouseKeeperNotes") {
                        that._WarehouseKeeperNotesTextBox.SetVisible(true);
                        colIndex--;
                    }
                    else if (generalFieldInfo.Name == "WareHouseDocRialiReference") {
                        that._CreateWareHouseDocRialiReferenceControl(parentControl, generalFieldInfo.Name,
                            generalFieldInfo.DataListFullName, generalFieldInfo.EntityCaptionFieldName, generalFieldInfo.Title);
                    }

                    colIndex++;
                }
                else {
                    if (generalFieldInfo.Name == "WarehouseKeeperNotes")
                        that._WarehouseKeeperNotesTextBox.SetVisible(false);
                }
            }

            that._FinancialDocTypeDropDownList = that.FindControl("FinancialDocTypeDropDownList");
            that._StuffLocationDropDownList = that.FindControl("StuffLocationDropDownList");
            that._MasterBatchNumberTextBox = that.FindControl("MasterBatchNumberTextBox");
            that._ReferenceDocLookupControl = that.FindControl("ReferenceDocLookupControl");
            that._TarafHesab_PersonLookupControl = that.FindControl("TarafHesab_PersonLookupControl");
            that._ManualReferenceDocNumberTextBox = that.FindControl("ManualReferenceDocNumberTextBox");
            that._Havale_SendTimeDateTime = that.FindControl("Havale_SendTimeDateTime");
            that._Havale_SendTypeTextBox = that.FindControl("Havale_SendTypeTextBox");
            that._Havale_NameTahvilgirandehAzAnbarTextBox = that.FindControl("Havale_NameTahvilgirandehAzAnbarTextBox");
            that._Havale_TelephoneTahvilgirandehAzAnbarTextBox = that.FindControl("Havale_TelephoneTahvilgirandehAzAnbarTextBox");
            that._Havale_NameTahvilgirandehTarafMoshtariTextBox = that.FindControl("Havale_NameTahvilgirandehTarafMoshtariTextBox");
            that._Havale_TelephoneTahvilgirandehTarafeMoshtariTextBox = that.FindControl("Havale_TelephoneTahvilgirandehTarafeMoshtariTextBox");
            that._Havale_ShomarehBarnamehTextBox = that.FindControl("Havale_ShomarehBarnamehTextBox");

            that._MainDockPanel.SetPaneSizeSetting(0, (that.RowIndex + 2) * 48 + 20);
        },

        _StuffLocationChanged: function () {
            var that = this;

            if (that._StuffLocationDropDownList.GetValue() == null) {
                that._BindableEntity.set("GhabzOrHavaleNumber", null);

                if (that.IsGridMode && that._ItemsGridControl != null)
                    that._ItemsGridControl.SetControlReadOnly("StuffLookupControl", true);

                return
            }

            that._BindableEntity.set("GhabzOrHavaleNumber",
                wm.GetNewGhabzOrHavaleNumber(that.WarehouseDocTypeID, that._StuffLocationDropDownList.GetValue()));

            if (that.IsGridMode && that._ItemsGridControl != null) {
                that._ItemsGridControl.SetControlReadOnly("StuffLookupControl", false);
                that._ItemsGridControl.SetStuffsLookupBaseFilterExpression();

                if (that.WarehouseDocTypeName == "Havale")
                    that._ItemsGridControl.SetStockLabelText();
            }

            that._AdjustForm();
        },

        _DestroyGeneralItemTabularPanel: function () {
            var that = this;

            if (!ValueIsEmpty(that._GeneralFieldsTabularPanel)) {
                that._GeneralFieldsTabularPanel.Destroy();
                that._GeneralFieldsTabularPanel = null;
            }

            that._FinancialDocTypeDropDownList = null;
            that._StuffLocationDropDownList = null;
            that._ReferenceDocLookupControl = null;
            that._TarafHesab_PersonLookupControl = null;
            that._Havale_SendTimeDateTime = null;
            that._Havale_SendTypeTextBox = null;
            that._Havale_NameTahvilgirandehAzAnbarTextBox = null;
            that._Havale_TelephoneTahvilgirandehAzAnbarTextBox = null;
            that._Havale_NameTahvilgirandehTarafMoshtariTextBox = null;
            that._Havale_TelephoneTahvilgirandehTarafeMoshtariTextBox = null;
            that._Havale_ShomarehBarnamehTextBox = null;
            that._WareHouseDocRialiReferenceLookup = null;
        },

        _DestroyGhabzOrHavaleItemsGridControl: function () {
            var that = this;

            that._ItemsGridControl.Destroy();
            that._ItemsGridControl = null;
        },

        _LookupControl_ValueChanged: function (e) {
            var that = this;

        },

        _CreateItemsGridControl: function () {
            var that = this;

            if (!that.IsGridMode)
                throw "calling _CreateItemsGridControl is invalid when GridMode is false.";

            if (that.ItemsEntityList == null)
                throw "ItemsEntityList is null.";

            that._ItemsGridControl = new wm.GhabzOrHavaleItemsGridControl({
                ParentControl: that._MainDockPanel.Panes[1],
                Name: "ItemsGridControl",
                GhabzOrHavaleEditForm: that,
                RowsEntityList: that.ItemsEntityList,
                GhabzOrHavaleTypeEntity: that.GhabzOrHavaleTypeEntity,
                FillParent: true
            });

            if (that.ItemsEntityList.Entities.length == 0)
                that._ItemsGridControl.AddEmptyItems(1);
            else {
                for (var i = 0; i < that.ItemsEntityList.Entities.length; i++) {
                    that._ItemsGridControl.AddRow(that.ItemsEntityList.Entities[i]);
                }
            }
        },

        _GenerateGhabzOrHavaleItemsByRefDoc: function () {
            var that = this;

            if (!that.IsGridMode)
                throw "calling _GenerateGhabzOrHavaleItems is invalid when GridMode is false.";

            //if (that.IsGridMode) {//************اینجا تنها باید آیتم ها را بدست آوریم و جای از بین بردن یا ایجاد گرید نیست. 
            //    if (that._ItemsGridControl != null)
            //        that._DestroyGhabzOrHavaleItemsGridControl();

            //    that.ItemsEntityList.Entities = [];
            //}

            var refDocFieldName = that._GetReferenceDocTypeEntity().GetFieldValue("RefDocFieldName");

            if (!ValueIsEmpty(that._BindableEntity.get(refDocFieldName))) {
                var generatedItems = afw.uiApi.CallServerMethodSync("wm.GenerateGhabzOrhavaleItems",
                    [that._BindableEntity.get("ReferenceDocType"),
                    that._BindableEntity.get(refDocFieldName),
                    that._BindableEntity.get("ID")]);

                that.ItemsEntityList = generatedItems;
            }
            else
                that.ItemsEntityList = afw.uiApi.CreateEntityList("wm.GhabzOrHavaleItem");

            that._FormEntity.SetFieldValue("GhabzOrHavaleItems", that.ItemsEntityList);
        },

        _CreateReferenceDocLookupControl: function (parentControl) {
            var that = this;

            if (!ValueIsEmpty(that._ReferenceDocLookupControl)
                && !that._ReferenceDocLookupControl.IsDestroying)
                that._ReferenceDocLookupControl.Destroy();

            var referenceDocTypeEntity = that._GetReferenceDocTypeEntity();

            var refDocEntityDefName = null;
            var refDocName = null;
            var refDocFieldName = null;
            var dataListFullName = null;
            var entityCaptionFieldName = null;
            var refDocTableName = null;
            var refDocDataListMode = null;

            if (!ValueIsEmpty(referenceDocTypeEntity)) {
                refDocEntityDefName = referenceDocTypeEntity.GetFieldValue("RefDocEntityDefName");
                refDocName = referenceDocTypeEntity.GetFieldValue("RefDocName");
                refDocFieldName = referenceDocTypeEntity.GetFieldValue("RefDocFieldName");
                dataListFullName = referenceDocTypeEntity.GetFieldValue("DataListFullName");
                entityCaptionFieldName = referenceDocTypeEntity.GetFieldValue("EntityCaptionFieldName");
                refDocTableName = referenceDocTypeEntity.GetFieldValue("RefDocTableName");
                refDocTitle = referenceDocTypeEntity.GetFieldValue("Title");
                refDocDataListMode = referenceDocTypeEntity.GetFieldValue("DataListMode");
            }

            that._ReferenceDocLookupControl = new afw.SingleEntityLookupControl({
                ParentControl: parentControl,
                Name: "ReferenceDocLookupControl",
                DataListFullName: dataListFullName,
                EntityCaptionFieldName: entityCaptionFieldName,
                LabelVisible: true,
                LabelText: refDocTitle,
                FillParent: true,
                HasEntityViewButton: false,
                LookupWindowDefaultWidth: 1300
            });

            if (!ValueIsEmpty(refDocFieldName)) {
                that._ReferenceDocLookupControl.SetValueDataMember(refDocFieldName);
                that._ReferenceDocLookupControl.InitDataBinding(that._BindableEntity);
            }

            that._ReferenceDocLookupControl.SetShowRequiredStar(true);
            var filterExpressionQuery = "";
            var finalApprovedWorkflowStage = cmn.GetWorkflowStageByName("SalesProformaInvoice", "FinalApproved");
            if (refDocName == "SalesProformaInvoice" && finalApprovedWorkflowStage != null) {
                filterExpressionQuery = String.Format("WorkflowStage = '{0}' and HavaleIssuingStatus = '{1}'",
                    finalApprovedWorkflowStage.GetFieldValue("ID"),
                    afw.OptionSetHelper.GetOptionSetItemID("cmn.HavaleIssuingStatus.HavaleNashodeh"));
            }

            if (ValueIsIn(refDocDataListMode, ["AmaniSalesProformaInvoiceLookup", "AmaniReturnFromSalesLookup"])) {
                if (!ValueIsEmpty(filterExpressionQuery))
                    filterExpressionQuery += " and ";
                filterExpressionQuery += "IsAmani = 1";
            }

            if (ValueIsIn(refDocDataListMode, ["SalesProformaInvoiceLookup"])) {
                if (!ValueIsEmpty(filterExpressionQuery))
                    filterExpressionQuery += " and ";
                filterExpressionQuery += "IsAmani = 0";
            }

            if (filterExpressionQuery != null)
                that._ReferenceDocLookupControl.SetBaseFilterExpression(filterExpressionQuery);

            that._ReferenceDocLookupControl.bind("OpeningLookup", function (e) { that._ReferenceDocLookupControl_OpeningLookup(e) });
            that._ReferenceDocLookupControl.bind("ValueChanged", function (e) {
                that._ReferenceDocLookupControl_ValueChanged(e)
            });
        },

        _GetReferenceDocTypeEntity: function () {
            var that = this;

            return $.grep(that._ReferenceDocTypes, function (o) {
                return o.GetFieldValue("ID") == that.GhabzOrHavaleTypeEntity.GetFieldValue("ReferenceDocType");
            })[0];
        },

        _ReferenceDocLookupControl_OpeningLookup: function (e) {
            var that = this;

            var referenceDocTypeEntity = that._GetReferenceDocTypeEntity();
            e.Sender.SetLookupDataListControlCustomOptions({ Mode: referenceDocTypeEntity.GetFieldValue("DataListMode") });
        },

        _ReferenceDocLookupControl_ValueChanged: function (e) {
            var that = this;

            if (that._ItemsGridControl != null)
                that._DestroyGhabzOrHavaleItemsGridControl();

            if (ValueIsEmpty(that._ReferenceDocLookupControl.GetValue())) {
                if (!ValueIsEmpty(that._TarafHesab_PersonLookupControl) && that._TarafHesab_PersonLookupControl.GetVisible() == true)
                    that._TarafHesab_PersonLookupControl.SetValue(null);

                that._AdjustForm();
                that._FinancialDocTypeDropDownList.SetValue(null);
                return;
            }

            var referenceDocTypeEntity = that._GetReferenceDocTypeEntity();
            var refDocTarafHesabPersonFieldName = referenceDocTypeEntity.GetFieldValue("RefDocTarafHesabPersonFieldName");
            var refDocEntity = afw.uiApi.FetchEntity(referenceDocTypeEntity.GetFieldValue("RefDocEntityDefName"),
                String.Format("ID = '{0}'", that._ReferenceDocLookupControl.GetValue()));

            if (!ValueIsEmpty(that._FinancialDocTypeDropDownList)) {
                that._FinancialDocTypeDropDownList.SetValue(refDocEntity.GetFieldValue("FinancialDocType"));
            }

            if (!ValueIsEmpty(refDocTarafHesabPersonFieldName)
                && !ValueIsEmpty(that._TarafHesab_PersonLookupControl)
                && that._TarafHesab_PersonLookupControl.GetVisible() == true) {
                that._TarafHesab_PersonLookupControl.SetValue(refDocEntity.GetFieldValue(refDocTarafHesabPersonFieldName));
            }

            that._BindableEntity.set("OrganizationUnit", refDocEntity.GetFieldValue("OrganizationUnit"));

            that._AdjustRialiReferenceLookup();
            that._ResetRialiReferenceLookupValue();

            that._GenerateGhabzOrHavaleItemsByRefDoc();
            that._CreateItemsGridControl();

            that._AdjustForm();
        },

        _DestroyItemsDataListControl: function () {
            var that = this;

            if (!ValueIsEmpty(that.ItemsDataListControl)) {
                that.ItemsDataListControl.Destroy();
                that.ItemsDataListControl = null;
            }
        },

        _DestroyDataListDockPanel: function () {
            var that = this;

            if (!ValueIsEmpty(that.DataListDockPanel)) {
                that.DataListDockPanel.Destroy();
                that.DataListDockPanel = null;
            }
        },

        _CreateItemsDataList: function () {
            var that = this;

            that._DestroyItemsDataListControl();
            that._DestroyDataListDockPanel();

            that.DataListDockPanel = new afw.DockPanel({
                ParentControl: that._MainDockPanel.Panes[1],
                Name: "DataListDockPanel",
                Orientation: "Vertical",
                PanesCount: 2,
                FillParent: true,
                Visible: true
            });

            that.DataListDockPanel.SetPaneSizeSetting(1, 1);

            that.ItemsDataListControl = new afw.uiApi.CreateDataListControl("wm.ItemsOfGhabzOrHavale", {
                ParentControl: that.DataListDockPanel.Panes[0],
                BaseFilterExpression: String.Format("GhabzOrHavale = '{0}'", that._BindableEntity.get("ID")),
                GhabzOrHavaleEditForm: that,
                FillParent: true
            });

            that.ItemsDataListControl.SetRowDoubleClickHandler(function (e) { });

            that.GhabzOrHavaleItemEntitiesGridView = that.ItemsDataListControl.GetEntitiesGridView();
            that.GhabzOrHavaleItemEntitiesGridView.bind("SelectedRowsChanged", function (e) { that._GhabzOrHavaleItemEntitiesGridView_SelectedRowsChanged(e); });
            that.ItemsDataListControl.bind("DataLoaded", function (e) { that._ItemsDataListControl_DataLoaded(e); });

        },

        _GhabzOrHavaleItemEntitiesGridView_SelectedRowsChanged: function (e) {
            var that = this;

            //بررسی شده است. محددا بررسی نشود
            if (that.GhabzOrHavaleItemEntitiesGridView.GetDataSource().data().length > 0
                && !ValueIsEmpty(that._GhabzOrHavaleItemForm))
                that._GhabzOrHavaleItemForm.ItemsGridControl.CloseForm();
        },

        _ItemsDataListControl_DataLoaded: function (e) {
            var that = this;

            if (that.GhabzOrHavaleItemEntitiesGridView.GetDataSource().data().length > 0) {
                that.GhabzOrHavaleItemEntitiesGridView.SelectRowByIndex(0);
                that.GhabzOrHavaleItemEntitiesGridView.Focus();
            }
        },

        _OpenNewGhabzOrHavaleItemForm: function () {
            var that = this;

            var ItemEntity = afw.uiApi.CreateNewEntity("wm.GhabzOrHavaleItem");

            var lastRowNumber = afw.uiApi.CallServerMethodSync("cmn.GetFieldMaxIntValue",
                ["RowNumber", "wm_GhabzOrHavaleItems", String.Format("GhabzOrHavale = '{0}'", that._BindableEntity.get("ID"))]);

            ItemEntity.SetFieldValue("GhabzOrHavale", that._BindableEntity.get("ID"));
            ItemEntity.SetFieldValue("RowNumber", lastRowNumber + 1);

            that.CreateGhabzOrHavaleItemForm(that, ItemEntity, "New");
        },

        CreateGhabzOrHavaleItemForm: function (ghabzOrHavaleEditForm, ghabzOrHavaleItemEntity, formMode) {
            var that = this;

            that.DataListDockPanel.SetPaneSizeSetting(1, 200);

            if (that.DataListDockPanel.Panes[1].HasChildControls) {
                that.DataListDockPanel.Panes[1].ChildControls[0].Destroy()
            }

            that._GhabzOrHavaleItemForm = new wm.GhabzOrHavaleItemForm({
                Name: "GhabzOrHavaleItemForm",
                ParentControl: that.DataListDockPanel.Panes[1],
                GhabzOrHavaleEditForm: ghabzOrHavaleEditForm,
                GhabzOrHavaleItemEntity: ghabzOrHavaleItemEntity,
                FormMode: formMode
            });
        },

        _DoDestroy: function () {
            var that = this;

            afw.BasePanel.fn._DoDestroy.call(that);
        },

        _OnOpened: function (sender, e) {
            var that = this;

            afw.Window.fn._OnOpened.call(that);

            if (that._FormMode == "New") {
                if (that._ActiveFinancialYearID == null) {
                    afw.ErrorDialog.Show("سال مالی فعال تعیین نشده است.");
                    that.Close();
                    return;
                }

                //اگر این فرم از طرق آیتم های درخواست حواله باز شود
                //واحد سازمانی آن از طریق عملیات مرتبط مقدار گرفته است
                that._ActiveOrgUnitID = cmn.GetUserActiveOrganizationUnitIDs();
                if (that._ActiveOrgUnitID.length != 1 && that._BindableEntity.get("OrganizationUnit") == null) {
                    afw.ErrorDialog.Show("واحد سازمانی فعال انتخاب نشده است.");
                    that.Close();
                    return;
                }

                that._BindableEntity.set("OrganizationUnit", that._ActiveOrgUnitID[0]);
            }
        },

        _OnClosed: function () {
            var that = this;

            afw.Window.fn._OnClosed.call(that);
        },

        _OnClosing: function () {
            var that = this;

            afw.Window.fn._OnClosing.call(that);
        },
                    
        _OnToolbarButtonClicked: function (buttonKey) {
            var that = this;

            afw.EntityWindowBase.fn._OnToolbarButtonClicked.call(that, buttonKey);
        },

        _AdjustForm: function () {
            var that = this;

            afw.EntityWindowBase.fn._AdjustForm.call(that);

            that._MainTabControl.SetTabEnabled(1, true);

            if (that._FormMode == "Edit") {
                if (that._HasMasterOp() && !that._CanChangeManualRialiAmount) {
                    // Hide ToolBar
                    that.EntityWindowBaseVDockPanel1.Panes[0].SetSizeSetting(1, 1);

                    if (that._ItemsGridControl != null) {
                        //Hide AddButton and RemoveButton
                        that._ItemsGridControl.SetAddRowButtonVisible(false);
                        that._SetRowsRemoveButtonVisible(false);
                    }
                    //اشکال: برای حالت دیتالیست انجام نشده
                }

                that.FindControl("GhabzOrHavaleTypeDropDownList").SetReadOnly(true);
            }

            if (!ValueIsEmpty(that.GhabzOrHavaleTypeEntity)) {
                var referenceDocTypeEntity = that._GetReferenceDocTypeEntity();

                if (that.IsGridMode && that._ItemsGridControl != null) {
                    //برای قبض و حواله هایی که از نوع سیستمی نیستند، همیشه کاربر می تواند آیتم های آنها را کم و زیاد کند
                    //برای قبض و حواله هایی که از نوع سیستمی هستند، کاربر تنها در صورتی می تواند آیتم های آنها را کم و زیاد کند
                    //که در تنظیمات آن نوع امکان اضافه کردن و کم کردن آیتم ها ست شده باشد.
                    //این تنظیمات برای کاربر قابل مشاهده نیست و توسط توسعه دهند سیستم با توجه به نوع قبض/ حواله تعیین می شود
                    if (referenceDocTypeEntity.GetFieldValue("IsUserDefined")) {
                        that._ItemsGridControl.SetAddRowButtonVisible(true);
                        that._SetRowsRemoveButtonVisible(true);
                    }
                    else {
                        if (that.GhabzOrHavaleTypeEntity.GetFieldValue("CanAddItems"))
                            that._ItemsGridControl.SetAddRowButtonVisible(true);
                        else
                            that._ItemsGridControl.SetAddRowButtonVisible(false);

                        if (that.GhabzOrHavaleTypeEntity.GetFieldValue("CanRemoveItems"))
                            that._SetRowsRemoveButtonVisible(true);
                        else
                            that._SetRowsRemoveButtonVisible(false);

                        if (!that._HasReferenceDoc) {
                            that._ItemsGridControl.SetAddRowButtonVisible(true);
                            that._SetRowsRemoveButtonVisible(true);
                        }
                    }
                }

                if (!that.IsGridMode) {
                    that._InnerPanel.SetMinHeight(that._CalculateFormHeight());
                    that._OuterPanel.AdjustScrollBars();

                    if (that._ReferenceDocLookupControl != null && that._ReferenceDocLookupControl.GetVisible() == true)
                        that._ReferenceDocLookupControl.SetReadOnly(true);
                }

                if (that._ReferenceDocLookupControl != null && that._ReferenceDocLookupControl.GetVisible() == true) {
                    if (!ValueIsEmpty(that._TarafHesab_PersonLookupControl) && that._TarafHesab_PersonLookupControl.GetVisible() == true)
                        that._TarafHesab_PersonLookupControl.SetReadOnly(true);

                    that._FinancialDocTypeDropDownList.SetReadOnly(true);
                }
                else {
                    if (!ValueIsEmpty(that._TarafHesab_PersonLookupControl) && that._TarafHesab_PersonLookupControl.GetVisible() == true)
                        that._TarafHesab_PersonLookupControl.SetReadOnly(false);
                }
            }

            if (!ValueIsEmpty(that._GhabzOrHavaleNumberTextBox) && that._GhabzOrHavaleNumberTextBox.GetVisible() == true)
                that._GhabzOrHavaleNumberTextBox.SetReadOnly(true);

            if (!ValueIsEmpty(that._BindableEntity.get("WareHouseDocRialiReference")) && that.GetFormMode() == "Edit") {
                if (!ValueIsEmpty(that._WareHouseDocRialiReferenceLookup))
                    that._WareHouseDocRialiReferenceLookup.SetReadOnly(true);
            }
        },

        _ValidateForm: function () {
            var that = this;

            if (!afw.EntityWindowBase.fn._ValidateForm.call(that))
                return false;

            if (!that._ValidateFormFields())
                return false;

            if (that.IsGridMode && !that._ItemsGridControl.ValidateRows())
                return false;

            return true;
        },

        _ValidateFormFields: function () {
            var that = this;

            if (!ValueIsEmpty(that._ReferenceDocLookupControl) && that._ReferenceDocLookupControl.GetVisible() == true) {
                if (ValueIsEmpty(that._ReferenceDocLookupControl.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را انتخاب کنید.", that._ReferenceDocLookupControl.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._IssueDateControl) && that._IssueDateControl.GetVisible() == true) {
                if (ValueIsEmpty(that._IssueDateControl.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را انتخاب کنید.", that._IssueDateControl.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._FinancialDocTypeDropDownList) && that._FinancialDocTypeDropDownList.GetVisible() == true) {
                if (ValueIsEmpty(that._FinancialDocTypeDropDownList.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را انتخاب کنید.", that._FinancialDocTypeDropDownList.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._StuffLocationDropDownList) && that._StuffLocationDropDownList.GetVisible() == true) {
                if (ValueIsEmpty(that._StuffLocationDropDownList.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را انتخاب کنید.", that._StuffLocationDropDownList.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._GhabzOrHavaleNumberTextBox) && that._GhabzOrHavaleNumberTextBox.GetVisible() == true) {
                if (ValueIsEmpty(that._GhabzOrHavaleNumberTextBox.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را وارد کنید.", that._GhabzOrHavaleNumberTextBox.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._GhabzOrHavaleTypeListDropDownList) && that._GhabzOrHavaleTypeListDropDownList.GetVisible() == true) {
                if (ValueIsEmpty(that._GhabzOrHavaleTypeListDropDownList.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را انتخاب کنید.", that._GhabzOrHavaleTypeListDropDownList.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._TarafHesab_PersonLookupControl) && that._TarafHesab_PersonLookupControl.GetVisible() == true) {
                if (ValueIsEmpty(that._TarafHesab_PersonLookupControl.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را انتخاب کنید.", that._TarafHesab_PersonLookupControl.GetLabelText()));
                    return false;
                }
            }

            if (!ValueIsEmpty(that._Havale_SendTimeDateTime) && that._Havale_SendTimeDateTime.GetVisible() == true) {
                if (ValueIsEmpty(that._Havale_SendTimeDateTime.GetValue())) {
                    afw.ErrorDialog.Show(String.Format("{0} را وارد کنید.", that._Havale_SendTimeDateTime.GetLabelText()));
                    return false;
                }
            }

            return true;
        },

        _CreateWareHouseDocRialiReferenceControl: function (parentControl, fieldName, dataListFullName, entityCaptionFieldName, labelText) {
            var that = this;

            that._WareHouseDocRialiReferenceLookup = new afw.SingleEntityLookupControl({
                ParentControl: parentControl,
                Name: fieldName + "LookupControl",
                LabelVisible: true,
                LabelText: labelText,
                FillParent: true,
                DataListFullName: dataListFullName,
                EntityCaptionFieldName: entityCaptionFieldName,
                ValueDataMember: fieldName
            });

            that._WareHouseDocRialiReferenceLookup.InitDataBinding(that._BindableEntity);
            that._WareHouseDocRialiReferenceLookup.SetShowRequiredStar(true);

            if (that._FormMode == "Edit")
                that._AdjustRialiReferenceLookup();
        },

        _AdjustRialiReferenceLookup: function () {
            var that = this;

            if (ValueIsEmpty(that._WareHouseDocRialiReferenceLookup))
                return;

            var filterExpression = "";

            filterExpression = afw.uiApi.CallServerMethodSync("wm.GetWareHouseDocRialiReferenceLookupFilterExpression",
                [that._FormEntity]);

            that._WareHouseDocRialiReferenceLookup.SetBaseFilterExpression(filterExpression);
        },

        _ResetRialiReferenceLookupValue: function () {
            var that = this;

            if (ValueIsEmpty(that._WareHouseDocRialiReferenceLookup))
                return;

            var wareHouseDocRialiReferenceEntityList = afw.DataListHelper.FetchEntityListOfDataList("wm.GhabzOrHavalehaList", null, null,
                that._WareHouseDocRialiReferenceLookup.GetBaseFilterExpression(), null, 1, 2);

            if (wareHouseDocRialiReferenceEntityList.Entities.length == 1)
                that._WareHouseDocRialiReferenceLookup.SetValue(wareHouseDocRialiReferenceEntityList.Entities[0].GetFieldValue("ID"));
            else
                that._WareHouseDocRialiReferenceLookup.SetValue(null);
        },

        _TextBox_ValueChanged: function (e) {
            var that = this;

            if (e.sender.GetName() == "MasterBatchNumberTextBox") {
                that._MasterBatchNumberTextBox_ValueChanged();
            }
        },

        _MasterBatchNumberTextBox_ValueChanged: function () {
            var that = this;

            if (that.IsGridMode && that._ItemsGridControl != null) {
                if (!ValueIsEmpty(that._MasterBatchNumberTextBox.GetValue())) {
                    that._ItemsGridControl.SetControlValue("BatchNumberComboBox", that._MasterBatchNumberTextBox.GetValue());
                    that._ItemsGridControl.SetControlReadOnly("BatchNumberComboBox", true);
                }
                else {
                    that._ItemsGridControl.SetControlValue("BatchNumberComboBox", null);
                    that._ItemsGridControl.SetControlReadOnly("BatchNumberComboBox", false);
                }
            }
        },

        _SetRowsRemoveButtonVisible: function (value) {
            var that = this;

            if (that.IsGridMode && that._ItemsGridControl != null)
                that._ItemsGridControl.SetControlVisible("RemoveButton", value);
        },

        _CreateTextBox: function (parentControl, fieldName, labelText) {
            var that = this;

            var textBox = new afw.TextBox({
                ParentControl: parentControl,
                Name: fieldName + "TextBox",
                Text: null,
                LabelVisible: true,
                LabelText: labelText,
                FillParent: true,
                Visible: true,
                Multiline: false,
                ValueDataMember: fieldName
            });

            if (fieldName != "MasterBatchNumber")
                textBox.InitDataBinding(that._BindableEntity);

            if (!ValueIsIn(fieldName, ["Havale_NameTahvilgirandehAzAnbar", "Havale_TelephoneTahvilgirandehAzAnbar", "MasterBatchNumber",
                "Havale_NameTahvilgirandehTarafMoshtari", "Havale_TelephoneTahvilgirandehTarafeMoshtari",
                "Havale_ShomarehBarnameh", "Havale_SendType", "ManualReferenceDocNumber"])) {
                textBox.SetShowRequiredStar(true);
            }

            textBox.bind("ValueChanged", function (e) { that._TextBox_ValueChanged(e); });

            return textBox;
        },

        _CreateNumericTextBox: function (parentControl, fieldName, labelText) {
            var that = this;

            var numericTextBox = new afw.NumericTextBox({
                ParentControl: parentControl,
                Name: fieldName + "NumericTextBox",
                Text: null,
                FillParent: true,
                Visible: true,
                LabelVisible: true,
                LabelText: labelText,
                Multiline: false,
                ValueDataMember: fieldName
            });

            if (fieldName != "RialiAmountSum")
                numericTextBox.InitDataBinding(that._BindableEntity);

            return numericTextBox;
        },

        _CreateLookupControl: function (parentControl, fieldName, dataListFullName, entityCaptionFieldName, labelText) {
            var that = this;

            var lookupControl = new afw.SingleEntityLookupControl({
                ParentControl: parentControl,
                Name: fieldName + "LookupControl",
                DataListFullName: dataListFullName,
                EntityCaptionFieldName: entityCaptionFieldName,
                LabelVisible: true,
                LabelText: labelText,
                FillParent: true,
                HasEntityViewButton: false,
                ValueDataMember: fieldName
            });

            lookupControl.InitDataBinding(that._BindableEntity);
            lookupControl.bind("ValueChanged", function (e) { that._LookupControl_ValueChanged(e); });
            lookupControl.SetShowRequiredStar(true);

            return lookupControl;
        },

        _CreateDateTimeControl: function (parentControl, fieldName, labelText, mode) {
            var that = this;

            var dateTimeControl = new afw.DateTimeControl({
                ParentControl: parentControl,
                Name: fieldName + "DateTime",
                Mode: mode,
                LabelVisible: true,
                LabelText: labelText,
                FillParent: true,
                ValueDataMember: fieldName
            });

            dateTimeControl.InitDataBinding(that._BindableEntity);
            dateTimeControl.SetShowRequiredStar(true);

            if (that._FormMode == "New")
                dateTimeControl.SetValue(afw.DateTimeHelper.GetServerDateTime());

            return dateTimeControl;
        },

        _CreateDropDownList: function (parentControl, fieldName, dataListFullName, dataTextField, dataValueField, labelText, filterExpression) {
            var that = this;

            var dropDownList = new afw.DropDownList({
                ParentControl: parentControl,
                Name: fieldName + "DropDownList",
                DataTextField: dataTextField,
                DataValueField: dataValueField,
                LabelVisible: true,
                LabelText: labelText,
                ValueDataMember: fieldName
            });

            var entityList = afw.DataListHelper.FetchEntityListOfDataList(dataListFullName, null, null, filterExpression);
            dropDownList.SetItemsDataSource(entityList.ToDataSourceData());

            dropDownList.InitDataBinding(that._BindableEntity);

            dropDownList.SetShowRequiredStar(true);
            dropDownList.bind("ValueChanged", function (e) { that._DropDownList_ValueChanged(e); });

            return dropDownList;
        },

        _CreateOptionSetControl: function (parentControl, fieldName, optionSetFullName, labelText) {
            var that = this;

            var optionSetControl = new afw.OptionSetControl({
                ParentControl: parentControl,
                Name: fieldName + "DropDownList",
                OptionSetFullName: optionSetFullName,
                LabelVisible: true,
                LabelText: labelText,
                ValueDataMember: fieldName,
            });

            optionSetControl.InitDataBinding(that._BindableEntity);

            optionSetControl.SetShowRequiredStar(true);
            optionSetControl.bind("ValueChanged", function (e) { that._DropDownList_ValueChanged(e); });

            return optionSetControl;
        },

        _DropDownList_ValueChanged: function (e) {
            var that = this;

            if (e.sender.GetName() == "StuffLocationDropDownList") {
                that._StuffLocationChanged();
            }

            if (e.sender.GetName() == "GhabzOrHavaleTypeDropDownList") {
                that._GhabzOrHavaleTypeDropDownList_ValueChanged(e);
            }
        },

        _HideShowHeaderControlDockPanel_Click: function (e) {
            var that = this;

            if (that._HeaderControlVisible) {
                that._HeaderControlVisible = false;
                that._HeaderDockPanel.SetPaneSizeSetting(0, 1);
                that._HeaderDockPanel.SetPaneSizeSetting(1, 1);
                that._HeaderDockPanel.SetPaneSizeSetting(2, 1);
                that._MainDockPanel.SetPaneSizeSetting(0, 23);
                that.FindControl("HideShowHeaderControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToDown)");
            }
            else {
                that._HeaderControlVisible = true;
                that._HeaderDockPanel.SetPaneSizeSetting(0, 10);
                that._HeaderDockPanel.SetPaneSizeSetting(1, 40);
                that._HeaderDockPanel.SetPaneSizeSetting(2, "fill");
                that._MainDockPanel.SetPaneSizeSetting(0, (that.RowIndex + 2) * 48 + 20);
                that.FindControl("HideShowHeaderControlImagePanel").SetBackgroundImage("resource(cmn.ArrowPointToUp)");
            }
        },

        RefreshRialiAmountSum: function () {
            var that = this;

            afw.uiApi.CallServerMethodAsync("wm.GetGhabzOrHavaleRialiAmountSum", [that._BindableEntity.get("ID")],
                function (result) {
                    if (that._IsDestroying)
                        return;

                    if (result.HasError)
                        afw.ErrorDialog.Show(result.ErrorMessage);
                    else {
                        that.FindControl("RialiAmountSumNumericTextBox").SetValue(result.Value);
                    }
                });
        },

        _HasMasterOp: function () {
            var that = this;

            return that._BindableEntity.get("RefDoc_GhetehBardariAzKala") != null
                || that._BindableEntity.get("RefDoc_StuffStatusChangeAndTransfer") != null
                || that._BindableEntity.get("RefDoc_WarehouseHybridOperation") != null
                || that._BindableEntity.get("RefDoc_MontageOp") != null
                || that._BindableEntity.get("RefDoc_DemontageOp") != null;
        },

        _CalculateFormHeight: function () {
            var that = this;

            var headerHeight = (that.RowIndex * 45) + 65;
            var dataListHeight = 400;
            var gridViewHeight = 200;

            return headerHeight + dataListHeight + gridViewHeight;
        },

        GetFormMode: function () {
            var that = this;

            return that._FormMode;
        },

        _Save: function () {
            var that = this;

            var saved = afw.EntityWindowBase.fn._Save.call(that);

            if (saved) {
                if (that.ItemsEntityList != null) {
                    for (var i = 0; i < that.ItemsEntityList.Entities.length; i++)
                        that.ItemsEntityList.Entities[i].ChangeStatus = "None";
                }
            }

            return saved;
        },

        Save: function () {
            var that = this;

            return that._Save();
        }
    });

    //Static Members:

    FormClass.TypeName = "wm.GhabzOrHavaleEditForm";
    FormClass.BaseType = afw.EntityWindowBase;

    wm.GhabzOrHavaleEditForm = FormClass;
})();