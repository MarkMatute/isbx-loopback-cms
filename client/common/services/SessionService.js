angular.module('dashboard.services.Session', [
  'dashboard.Utils',
  'dashboard.services.User',
  'ngCookies'
])

.service('SessionService', function($cookies, $cookieStore, $q, UserService, Config, Utils) {
  var session = null;
  function init() {
    var sessionStr = $cookies.get('session');
    if (sessionStr) {
      session = JSON.parse(sessionStr);
    }
  }

  this.logIn = function(email, password, options) {
	  var authModel = "Users";
	  if (config.authModel) authModel = config.authModel; 
       return Utils.apiHelper('POST', authModel + '/login?include=user', { email: email, password: password,  options: options})
	      .then(function(userInfo) {
	      	return self.setSession(userInfo);
				})
	      ["catch"](function() {
	          $cookies.put('session', null);
	          return $q.reject(arguments);
        });
  };

  this.logOut = function() {
  	var authModel = "Users";
  	if (config.authModel) authModel = config.authModel;
		var accessToken = $cookies.get('accessToken');
		$cookieStore.remove('username');
		$cookieStore.remove('userId');
		$cookieStore.remove('accessToken');
		$cookieStore.remove('roles');
		$cookieStore.remove('session');
	  return Utils.apiHelper('POST', authModel + '/logout?access_token=' + accessToken);
  };

  this.setSession = function(userInfo) {
    return Utils.apiHelper('GET', 'Roles?access_token=' + userInfo.id)
      .then(function(roles) {
        return Utils.apiHelper('GET', 'RoleMappings?filter[where][principalId]='+userInfo.userId+'&access_token=' + userInfo.id)
          .then(function(roleMappings) {
            session = userInfo;
            $cookies.put('username', userInfo.user.username);
            $cookies.put('userId', userInfo.userId);
            $cookies.put('accessToken', userInfo.id);
            $cookies.put('session', JSON.stringify(session));
            //get role name and description
            for (var i in roleMappings) {
              var roleMap = roleMappings[i];
              var role = _.find(roles, {id: roleMap.roleId});
              if (role) {
                roleMap.name = role.name;
                roleMap.description = role.description;
              }
            }
            $cookies.put('roles', JSON.stringify(roleMappings));
            return userInfo;

          })["catch"](function() {
          $cookies.put('session', null);
          return $q.reject(arguments);
        });

      })["catch"](function() {
      $cookies.put('session', null);
      return $q.reject(arguments);
    });
	};

  this.getAuthToken = function() {
    return session && session.id;
  };

  /**
	 * Stores a key/value pair in session object
   * @param key
   * @param value
   */
  this.put = function(key, value) {
    var session = JSON.parse($cookies.get('session'));
    session[key] = value;
    $cookies.put('session', JSON.stringify(session));
	};

  this.get = function(key) {
    var session = JSON.parse($cookies.get('session'));
    return session[key];
	};

  init();
})

;
