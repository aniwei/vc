// This wrapper header exists to provide pnglibconf.h in the include path.
// libpng expects "pnglibconf.h" to be available, but our checkout keeps the
// upstream-generated/prebuilt config file under scripts/.

#include "../externals/libpng/scripts/pnglibconf.h.prebuilt"
