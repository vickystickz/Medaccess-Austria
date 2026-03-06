<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor xmlns="http://www.opengis.net/sld" version="1.0.0" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" xmlns:sld="http://www.opengis.net/sld">
  <UserLayer>
    <sld:LayerFeatureConstraints>
      <sld:FeatureTypeConstraint/>
    </sld:LayerFeatureConstraints>
    <sld:UserStyle>
      <sld:Name>ESTAT_OBS-VALUE-T_2021_V2</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:RasterSymbolizer>
            <sld:ChannelSelection>
              <sld:GrayChannel>
                <sld:SourceChannelName>1</sld:SourceChannelName>
              </sld:GrayChannel>
            </sld:ChannelSelection>
            <sld:ColorMap type="ramp">
              <sld:ColorMapEntry color="#fff5f0" label="-321.9333" quantity="-321.93325809999999"/>
              <sld:ColorMapEntry color="#fcbea5" label="3089.1270" quantity="3089.1269607250001"/>
              <sld:ColorMapEntry color="#fb7050" label="6500.1872" quantity="6500.1871795500001"/>
              <sld:ColorMapEntry color="#d32020" label="9911.2474" quantity="9911.2473983750006"/>
              <sld:ColorMapEntry color="#67000d" label="13322.3076" quantity="13322.3076172"/>
            </sld:ColorMap>
          </sld:RasterSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </UserLayer>
</StyledLayerDescriptor>
