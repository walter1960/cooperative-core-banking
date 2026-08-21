/// Network Connectivity Information interface
abstract class NetworkInfo {
  Future<bool> get isConnected;
}

class AlwaysOnlineNetworkInfo implements NetworkInfo {
  @override
  Future<bool> get isConnected async => true;
}

class ControllableNetworkInfo implements NetworkInfo {
  bool _online = true;

  void setOnline(bool online) {
    _online = online;
  }

  @override
  Future<bool> get isConnected async => _online;
}
