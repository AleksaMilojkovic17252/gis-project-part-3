export const FeaturePopup: React.FC<FeaturePopupProps> = ({
  properties,
  layerName,
}) => {
  if (!properties)
    return <div className="text-sm text-slate-500">{layerName}</div>;

  const title: string = properties.name || layerName;
  const skipFields = ["geom", "tags"];
  const entries = Object.entries(properties).filter(
    ([key, val]) => val != null && val != "" && !skipFields.includes(key),
  );

  return (
    <div className="max-w-xs">
      <h3 className="text-sm font-semibold text-slate-800 mb-1 pb-1 border-b border-slate-200">
        {title}
      </h3>
      {entries.length == 0 ? (
        <p className="text-xs text-slate-400 italic">No attributes</p>
      ) : (
        <table className="w-full text-xs">
          <tbody>
            {entries.map(([key, val]) => (
              <tr key={key} className="border-b border-slate-100 last:border-0">
                <td className="py-1 pr-3 font-medium text-slate-500 whitespace-nowrap align-top">
                  {key}
                </td>
                <td className="py-1 text-slate-700 break-words">
                  {typeof val === "object" ? JSON.stringify(val) : String(val)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

interface FeaturePopupProps {
  properties: Record<string, string>;
  layerName: string;
}
