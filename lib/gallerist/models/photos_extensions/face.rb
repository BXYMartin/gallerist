# This code is free software; you can redistribute it and/or modify it under
# the terms of the new BSD License.
#
# Copyright (c) 2019, Sebastian Staudt

module Gallerist::PhotosExtensions::Face

  def __extend
    self.table_name = 'RKFace'

    has_one :person, primary_key: 'personId', foreign_key: 'modelId'
    has_one :photo, primary_key: 'imageModelId', foreign_key: 'modelId'

    alias_attribute :center_x, :centerX
    alias_attribute :center_y, :centerY
    alias_attribute :source_height, :sourceHeight
    alias_attribute :source_width, :sourceWidth
  end

end
