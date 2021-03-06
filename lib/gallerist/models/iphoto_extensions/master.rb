# This code is free software; you can redistribute it and/or modify it under
# the terms of the new BSD License.
#
# Copyright (c) 2015, Sebastian Staudt

module Gallerist::IphotoExtensions::Master

  def __extend
    default_scope do
      select :fileName, :imagePath, :modelId, :type, :uuid
    end
  end

end
