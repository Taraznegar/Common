using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TarazNegarAppFrameworkPlugin.ServerPlugins
{
    public interface ISubsystem
    {
        void CopyFinancialYearSettings(Guid sourceFinancialYearID, Guid destinationFinancialYearID);
    }
}
